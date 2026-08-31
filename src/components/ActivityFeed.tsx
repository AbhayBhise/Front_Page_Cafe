import { timeAgo } from '../lib/format';
import type { ActivityLog } from '../services/cafeService';

const ICON: Record<string, string> = {
  order: 'receipt',
  auth: 'box-arrow-in-right',
  cafe: 'shop',
  menu: 'card-list',
  staff: 'people',
  counter: 'display',
  user: 'person',
  admin: 'shield-lock',
};

const humanize = (action: string) => action.replace(/[._]/g, ' ');

const ActivityFeed = ({ items }: { items: ActivityLog[] }) => {
  if (items.length === 0) return <p className="text-muted small py-3 text-center">No activity recorded yet.</p>;
  return (
    <ul className="list-unstyled mb-0">
      {items.map((a) => {
        const group = a.action.split('.')[0];
        return (
          <li key={a.id} className="d-flex gap-3 py-2 border-bottom">
            <span
              className="d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary flex-shrink-0"
              style={{ width: 34, height: 34 }}
            >
              <i className={`bi bi-${ICON[group] ?? 'dot'}`} />
            </span>
            <div className="flex-grow-1">
              <div className="small">
                <span className="fw-semibold text-capitalize">{humanize(a.action)}</span>
                {a.actor && <span className="text-muted"> · {a.actor.name}</span>}
                {a.cafe && <span className="text-muted"> · {a.cafe.name}</span>}
              </div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                {timeAgo(a.createdAt)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ActivityFeed;
