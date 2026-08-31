import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { timeAgo } from '../lib/format';
import type { Notification } from '../types';

const NotificationBell = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await notificationService.list();
      setItems(res.data);
      setUnread(res.meta.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useSocketEvent('order:updated', () => void load());
  useSocketEvent('order:new', () => void load());
  useSocketEvent('cafe:status', () => void load());

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const openItem = async (n: Notification) => {
    if (!n.readAt) {
      await notificationService.markRead(n.id).catch(() => undefined);
      setUnread((u) => Math.max(0, u - 1));
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    }
    const orderId = (n.data as { orderId?: string } | null)?.orderId;
    setOpen(false);
    if (orderId) navigate(`/orders/${orderId}`);
  };

  const markAll = async () => {
    await notificationService.markAllRead().catch(() => undefined);
    setUnread(0);
    setItems((list) => list.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
  };

  return (
    <div className="nav-item position-relative mx-1" ref={ref}>
      <button
        className="btn border-0 position-relative"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell fs-4" />
        {unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow position-absolute p-0"
          style={{ right: 0, width: 320, maxHeight: 420, overflowY: 'auto', zIndex: 1050 }}
        >
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
            <span className="fw-bold">Notifications</span>
            {unread > 0 && (
              <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="text-center text-muted small py-4">You're all caught up</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={`dropdown-item d-flex flex-column align-items-start py-2 border-bottom ${
                  n.readAt ? '' : 'bg-light'
                }`}
                onClick={() => openItem(n)}
                style={{ whiteSpace: 'normal' }}
              >
                <span className="fw-semibold small">{n.title}</span>
                {n.body && <span className="text-muted small">{n.body}</span>}
                <span className="text-muted" style={{ fontSize: 11 }}>
                  {timeAgo(n.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
