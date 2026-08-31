import crypto from 'crypto';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequest, Forbidden, NotFound } from '../../lib/errors';
import { signGuestToken } from '../../lib/auth-tokens';
import { hashPassword } from '../../lib/password';
import { recordActivity } from '../../lib/activity';

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

const publicCafe = {
  id: true,
  name: true,
  slug: true,
  description: true,
  welcomeMessage: true,
  announcement: true,
  logoUrl: true,
  bannerUrl: true,
  isOpen: true,
  currency: true,
  taxRate: true,
} as const;

export async function resolveTable(cafeSlug: string, tableCode: string, k: string) {
  if (!k) throw Forbidden('Invalid QR code');
  const cafe = await prisma.cafe.findFirst({
    where: { slug: cafeSlug, status: 'approved' },
    select: publicCafe,
  });
  if (!cafe) throw NotFound('Cafe not found');

  const table = await prisma.table.findUnique({
    where: { cafeId_code: { cafeId: cafe.id, code: tableCode } },
  });
  if (!table || !table.isActive) throw NotFound('This table is not active');
  if (!safeEqual(table.qrSecret, k)) throw Forbidden('This QR code is no longer valid — ask staff for a new one');

  return { cafe, table };
}

export async function startGuestSession(cafeSlug: string, tableCode: string, k: string, req: Request) {
  const { cafe, table } = await resolveTable(cafeSlug, tableCode, k);

  const rand = crypto.randomBytes(9).toString('hex');
  const guest = await prisma.user.create({
    data: {
      name: `Guest · ${table.label}`,
      email: `guest_${rand}@table.local`,
      passwordHash: await hashPassword(crypto.randomBytes(24).toString('hex')),
      role: 'customer',
      isGuest: true,
    },
  });

  const token = signGuestToken({ sub: guest.id, email: guest.email, cafeId: cafe.id, tableId: table.id });

  await recordActivity({
    action: 'qr.session_started',
    actorId: guest.id,
    cafeId: cafe.id,
    entityType: 'table',
    entityId: table.id,
    req,
  });

  return {
    token,
    cafe,
    table: { id: table.id, label: table.label },
    guest: { id: guest.id, name: guest.name },
  };
}
