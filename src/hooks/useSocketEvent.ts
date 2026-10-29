import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

/** Subscribe to a socket event for the lifetime of the component. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const saved = useRef(handler);

  useEffect(() => {
    saved.current = handler;
  });

  useEffect(() => {
    const socket = getSocket();
    const fn = (payload: T) => saved.current(payload);
    if (socket) {
      socket.on(event, fn);
    }

    // Also listen for simulated offline events
    const winHandler = (e: Event) => {
      const custom = e as CustomEvent<T>;
      saved.current(custom.detail);
    };
    window.addEventListener(`fpc:${event}`, winHandler);

    return () => {
      socket?.off(event, fn);
      window.removeEventListener(`fpc:${event}`, winHandler);
    };
  }, [event]);
}

/** Emit a heartbeat every `ms` so presence stays fresh. */
export function useHeartbeat(enabled: boolean, ms = 30000) {
  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('heartbeat');
    const id = setInterval(() => socket.emit('heartbeat'), ms);
    return () => clearInterval(id);
  }, [enabled, ms]);
}
