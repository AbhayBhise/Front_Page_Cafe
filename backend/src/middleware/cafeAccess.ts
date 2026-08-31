import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { BadRequest, Forbidden, NotFound, Unauthorized } from '../lib/errors';

function pickCafeId(req: Request): string | undefined {
  return (
    (req.params.cafeId as string | undefined) ??
    (req.body?.cafeId as string | undefined) ??
    (req.query.cafeId as string | undefined) ??
    (req.headers['x-cafe-id'] as string | undefined)
  );
}

/**
 * Ensures the authenticated user may operate on the target cafe.
 * - owner: must own it
 * - counter: must be assigned staff of it (and it must be approved+open scoped elsewhere)
 * - admin: allowed (read/manage)
 * Populates req.cafeContext.
 */
export async function requireCafeAccess(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const cafeId = pickCafeId(req);
    if (!cafeId) throw BadRequest('Cafe id is required for this action');

    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw NotFound('Cafe not found');

    if (req.auth.role === 'admin') {
      req.cafeContext = { id: cafe.id, role: 'owner' };
      return next();
    }

    if (req.auth.role === 'owner') {
      if (cafe.ownerId !== req.auth.id) throw Forbidden('You do not own this cafe');
      req.cafeContext = { id: cafe.id, role: 'owner' };
      return next();
    }

    if (req.auth.role === 'counter') {
      const staff = await prisma.cafeStaff.findUnique({ where: { userId: req.auth.id } });
      if (!staff || staff.cafeId !== cafe.id || !staff.isActive) {
        throw Forbidden('You are not assigned to this cafe');
      }
      req.cafeContext = { id: cafe.id, role: 'counter', counterId: staff.counterId };
      return next();
    }

    throw Forbidden();
  } catch (err) {
    next(err);
  }
}
