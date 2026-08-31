import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../lib/auth-tokens';
import { prisma } from '../lib/prisma';
import { Forbidden, Unauthorized } from '../lib/errors';

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Require a valid access token + an active user. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (!token) throw Unauthorized('Missing access token');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw Unauthorized('Invalid or expired access token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw Unauthorized('Account no longer exists');
    if (user.status === 'suspended') throw Forbidden('Your account has been suspended');

    req.auth = {
      id: user.id,
      email: user.email,
      role: user.role,
      guest: payload.guest === true || user.isGuest,
      cafeId: payload.cafeId,
      tableId: payload.tableId,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Attach auth context when a token is present, but never reject. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.status === 'active') {
      req.auth = { id: user.id, email: user.email, role: user.role };
    }
  } catch {
    /* ignore — treated as guest */
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(Unauthorized());
    if (!roles.includes(req.auth.role)) return next(Forbidden());
    next();
  };
}

/** Reject QR quick-dine guest sessions — for account/profile actions. */
export function blockGuests(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.guest) return next(Forbidden('Create an account to use this feature'));
  next();
}
