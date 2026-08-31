import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

/** Subscribe to a socket event for the lifetime of the component. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const fn = (payload: T) => saved.current(payload);
    socket.on(event, fn);
    return () => {
      socket.off(event, fn);
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
