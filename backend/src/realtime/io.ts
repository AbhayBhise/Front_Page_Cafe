import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../lib/auth-tokens';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { recordActivity } from '../lib/activity';
import { presence } from './presence';

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error('Realtime layer not initialised');
  return io;
}

export function emitToCafe(cafeId: string, event: string, payload: unknown) {
  io?.to(`cafe:${cafeId}`).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function broadcastPresence(cafeId: string) {
  io?.to(`cafe:${cafeId}`).emit('presence:update', {
    cafeId,
    staff: presence.list(cafeId),
    onlineCount: presence.onlineCount(cafeId),
  });
}

interface SocketUser {
  id: string;
  name: string;
  role: 'customer' | 'counter' | 'owner' | 'admin';
  cafeId: string | null;
  counterId: string | null;
  counterName: string | null;
  presenceRole: 'owner' | 'counter' | null;
}

export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        if (!env.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
    },
  });

  io.use(async (socket, nextFn) => {
    try {
      const token: string | undefined =
        socket.handshake.auth?.token || (socket.handshake.headers.authorization || '').replace('Bearer ', '');
      if (!token) return nextFn(new Error('unauthorized'));

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { staffProfile: { include: { counter: true, cafe: true } }, ownedCafes: true },
      });
      if (!user || user.status !== 'active') return nextFn(new Error('unauthorized'));

      let cafeId: string | null = null;
      let presenceRole: 'owner' | 'counter' | null = null;
      let counterId: string | null = null;
      let counterName: string | null = null;

      if (user.role === 'counter' && user.staffProfile) {
        cafeId = user.staffProfile.cafeId;
        presenceRole = 'counter';
        counterId = user.staffProfile.counterId;
        counterName = user.staffProfile.counter?.name ?? null;
      } else if (user.role === 'owner' && user.ownedCafes[0]) {
        cafeId = user.ownedCafes[0].id;
        presenceRole = 'owner';
      }

      (socket.data as { user: SocketUser }).user = {
        id: user.id,
        name: user.name,
        role: user.role,
        cafeId,
        counterId,
        counterName,
        presenceRole,
      };
      nextFn();
    } catch {
      nextFn(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket.data as { user: SocketUser }).user;
    socket.join(`user:${user.id}`);

    // Owner may monitor a specific cafe passed on the handshake, else their own.
    const monitorCafeId =
      (socket.handshake.query.cafeId as string | undefined) || user.cafeId || null;

    if (user.role === 'admin' && monitorCafeId) {
      socket.join(`cafe:${monitorCafeId}`);
      broadcastPresence(monitorCafeId);
    }

    if (user.presenceRole && user.cafeId) {
      socket.join(`cafe:${user.cafeId}`);
      presence.add(user.cafeId, socket.id, {
        userId: user.id,
        name: user.name,
        role: user.presenceRole,
        counterId: user.counterId,
        counterName: user.counterName,
      });
      broadcastPresence(user.cafeId);
      void recordActivity({
        action: user.presenceRole === 'counter' ? 'counter.online' : 'owner.online',
        actorId: user.id,
        cafeId: user.cafeId,
        metadata: { counterId: user.counterId },
      });
    }

    socket.on('heartbeat', () => {
      if (user.cafeId) {
        presence.touch(user.cafeId, user.id);
        broadcastPresence(user.cafeId);
      }
    });

    socket.on('disconnect', () => {
      if (user.presenceRole && user.cafeId) {
        presence.remove(user.cafeId, socket.id, user.id);
        broadcastPresence(user.cafeId);
        const stillOnline = presence.list(user.cafeId).some((e) => e.userId === user.id && e.online);
        if (!stillOnline) {
          void recordActivity({
            action: user.presenceRole === 'counter' ? 'counter.offline' : 'owner.offline',
            actorId: user.id,
            cafeId: user.cafeId,
            metadata: { counterId: user.counterId },
          });
        }
      }
    });
  });

  logger.info('Realtime layer initialised');
  return io;
}
