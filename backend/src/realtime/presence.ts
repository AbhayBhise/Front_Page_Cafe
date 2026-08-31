export interface PresenceEntry {
  userId: string;
  name: string;
  role: 'owner' | 'counter';
  counterId: string | null;
  counterName: string | null;
  sockets: Set<string>;
  connectedAt: string;
  lastSeenAt: string;
}

export interface PresenceView {
  userId: string;
  name: string;
  role: 'owner' | 'counter';
  counterId: string | null;
  counterName: string | null;
  online: boolean;
  connectedAt: string;
  lastSeenAt: string;
}

/** cafeId -> userId -> entry */
const byCafe = new Map<string, Map<string, PresenceEntry>>();

export const presence = {
  add(cafeId: string, socketId: string, info: Omit<PresenceEntry, 'sockets' | 'connectedAt' | 'lastSeenAt'>) {
    const now = new Date().toISOString();
    let cafe = byCafe.get(cafeId);
    if (!cafe) {
      cafe = new Map();
      byCafe.set(cafeId, cafe);
    }
    const existing = cafe.get(info.userId);
    if (existing) {
      existing.sockets.add(socketId);
      existing.lastSeenAt = now;
      existing.counterId = info.counterId;
      existing.counterName = info.counterName;
    } else {
      cafe.set(info.userId, {
        ...info,
        sockets: new Set([socketId]),
        connectedAt: now,
        lastSeenAt: now,
      });
    }
  },

  remove(cafeId: string, socketId: string, userId: string) {
    const cafe = byCafe.get(cafeId);
    const entry = cafe?.get(userId);
    if (!entry) return;
    entry.sockets.delete(socketId);
    if (entry.sockets.size === 0) {
      cafe!.delete(userId);
    }
  },

  touch(cafeId: string, userId: string) {
    const entry = byCafe.get(cafeId)?.get(userId);
    if (entry) entry.lastSeenAt = new Date().toISOString();
  },

  list(cafeId: string): PresenceView[] {
    const cafe = byCafe.get(cafeId);
    if (!cafe) return [];
    return [...cafe.values()].map((e) => ({
      userId: e.userId,
      name: e.name,
      role: e.role,
      counterId: e.counterId,
      counterName: e.counterName,
      online: e.sockets.size > 0,
      connectedAt: e.connectedAt,
      lastSeenAt: e.lastSeenAt,
    }));
  },

  onlineCount(cafeId: string): number {
    return this.list(cafeId).filter((e) => e.online).length;
  },
};
