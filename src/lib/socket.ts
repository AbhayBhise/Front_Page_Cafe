import { io, type Socket } from 'socket.io-client';
import { tokenStore } from './api';

const isGh =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') || window.location.hostname.includes('pages.dev'));
const hasNoRemoteSocket = !import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_SOCKET_URL === '';

// Empty / unset -> connect to the page's own origin (production: nginx proxies /socket.io).
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL === undefined
    ? 'http://localhost:5000'
    : import.meta.env.VITE_SOCKET_URL || undefined;

let socket: Socket | null = null;

export function connectSocket(cafeId?: string): Socket | null {
  // If running statically on GitHub Pages without a remote socket server, skip socket.io connection
  if (isGh && hasNoRemoteSocket) {
    return null;
  }

  const token = tokenStore.access;
  if (!token) return null;
  if (socket?.connected) return socket;
  socket?.disconnect();
  socket = io(SOCKET_URL, {
    auth: { token },
    query: cafeId ? { cafeId } : undefined,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
