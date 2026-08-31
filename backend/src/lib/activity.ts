import type { Request } from 'express';
import { prisma } from './prisma';
import { logger } from './logger';

export interface ActivityInput {
  action: string;
  actorId?: string | null;
  cafeId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

/** Fire-and-forget audit trail write. Never throws into the request path. */
export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? input.req?.auth?.id ?? null,
        cafeId: input.cafeId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as object | undefined,
        ip: input.req?.ip,
        userAgent: input.req?.headers['user-agent'],
      },
    });
  } catch (err) {
    logger.error('Failed to record activity', { action: input.action, err: String(err) });
  }
}
