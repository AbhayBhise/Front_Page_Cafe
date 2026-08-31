import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  role: 'customer' | 'counter' | 'owner' | 'admin';
  email: string;
  /** present only for QR quick-dine guest sessions */
  guest?: true;
  cafeId?: string;
  tableId?: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl as SignOptions['expiresIn'],
  });
}

/** Short-lived token for an anonymous diner who scanned a table QR. */
export function signGuestToken(payload: {
  sub: string;
  email: string;
  cafeId: string;
  tableId: string;
}): string {
  return jwt.sign(
    { ...payload, role: 'customer' as const, guest: true as const },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.guestTtl as SignOptions['expiresIn'] },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

/** Opaque refresh token: random string, only its SHA-256 hash is stored. */
export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(48).toString('base64url');
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
