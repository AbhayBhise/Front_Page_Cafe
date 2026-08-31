import crypto from 'crypto';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { BadRequest, Conflict, Forbidden, NotFound } from '../../lib/errors';
import { hashPassword } from '../../lib/password';
import { slugify } from '../../lib/slug';
import { recordActivity } from '../../lib/activity';
import { emitToUser } from '../../realtime/io';

const newQrSecret = () => crypto.randomBytes(24).toString('base64url');

function tableWithQr(cafeSlug: string, t: { id: string; label: string; code: string; qrSecret: string; isActive: boolean; createdAt: Date }) {
  return {
    id: t.id,
    label: t.label,
    code: t.code,
    isActive: t.isActive,
    createdAt: t.createdAt,
    qrUrl: `${env.publicWebUrl}/t/${cafeSlug}/${t.code}?k=${t.qrSecret}`,
  };
}

export async function listTables(cafeId: string) {
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId }, select: { slug: true } });
  const tables = await prisma.table.findMany({ where: { cafeId }, orderBy: { createdAt: 'asc' } });
  return tables.map((t) => tableWithQr(cafe.slug, t));
}

export async function createTable(cafeId: string, input: { label: string; code?: string }, req: Request) {
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId }, select: { slug: true } });
  const code = slugify(input.code || input.label) || `t-${crypto.randomBytes(2).toString('hex')}`;
  const exists = await prisma.table.findUnique({ where: { cafeId_code: { cafeId, code } } });
  if (exists) throw Conflict('A table with that code already exists');
  const table = await prisma.table.create({
    data: { cafeId, label: input.label, code, qrSecret: newQrSecret() },
  });
  await recordActivity({ action: 'table.created', cafeId, entityType: 'table', entityId: table.id, req });
  return tableWithQr(cafe.slug, table);
}

export async function updateTable(cafeId: string, tableId: string, data: { label?: string; isActive?: boolean }, req: Request) {
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId }, select: { slug: true } });
  const table = await prisma.table.findFirst({ where: { id: tableId, cafeId } });
  if (!table) throw NotFound('Table not found');
  const updated = await prisma.table.update({ where: { id: tableId }, data });
  await recordActivity({ action: 'table.updated', cafeId, entityType: 'table', entityId: tableId, req });
  return tableWithQr(cafe.slug, updated);
}

export async function rotateTableSecret(cafeId: string, tableId: string, req: Request) {
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId }, select: { slug: true } });
  const table = await prisma.table.findFirst({ where: { id: tableId, cafeId } });
  if (!table) throw NotFound('Table not found');
  const updated = await prisma.table.update({ where: { id: tableId }, data: { qrSecret: newQrSecret() } });
  await recordActivity({ action: 'table.qr_rotated', cafeId, entityType: 'table', entityId: tableId, req });
  return tableWithQr(cafe.slug, updated);
}

export async function deleteTable(cafeId: string, tableId: string, req: Request) {
  const table = await prisma.table.findFirst({ where: { id: tableId, cafeId }, include: { _count: { select: { orders: true } } } });
  if (!table) throw NotFound('Table not found');
  if (table._count.orders > 0) {
    await prisma.table.update({ where: { id: tableId }, data: { isActive: false } });
  } else {
    await prisma.table.delete({ where: { id: tableId } });
  }
  await recordActivity({ action: 'table.deleted', cafeId, entityType: 'table', entityId: tableId, req });
}

const publicCafeSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  city: true,
  state: true,
  addressLine: true,
  phone: true,
  logoUrl: true,
  bannerUrl: true,
  isOpen: true,
  currency: true,
  taxRate: true,
} as const;

export async function listPublicCafes(query: { q?: string; city?: string; page: number; pageSize: number }) {
  const where = {
    status: 'approved' as const,
    ...(query.city ? { city: { equals: query.city, mode: 'insensitive' as const } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' as const } },
            { description: { contains: query.q, mode: 'insensitive' as const } },
            { city: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.cafe.count({ where }),
    prisma.cafe.findMany({
      where,
      select: { ...publicCafeSelect, _count: { select: { menuItems: true } } },
      orderBy: [{ isOpen: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, items };
}

export async function getPublicCafe(idOrSlug: string) {
  const cafe = await prisma.cafe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], status: 'approved' },
    select: publicCafeSelect,
  });
  if (!cafe) throw NotFound('Cafe not found or not yet approved');
  return cafe;
}

export async function getOwnerCafe(ownerId: string) {
  const cafe = await prisma.cafe.findFirst({
    where: { ownerId },
    orderBy: { createdAt: 'asc' },
    include: {
      counters: { orderBy: { createdAt: 'asc' } },
      _count: { select: { menuItems: true, orders: true, staff: true } },
    },
  });
  if (!cafe) throw NotFound('You have not registered a cafe yet');
  return cafe;
}

export async function updateCafe(cafeId: string, data: Record<string, unknown>, req: Request) {
  const cafe = await prisma.cafe.update({ where: { id: cafeId }, data });
  await recordActivity({ action: 'cafe.updated', cafeId, entityType: 'cafe', entityId: cafeId, req });
  return cafe;
}

export async function setOpen(cafeId: string, isOpen: boolean, req: Request) {
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId } });
  if (cafe.status !== 'approved') throw Forbidden('Cafe must be approved before it can open');
  const updated = await prisma.cafe.update({ where: { id: cafeId }, data: { isOpen } });
  await recordActivity({ action: isOpen ? 'cafe.opened' : 'cafe.closed', cafeId, req });
  return updated;
}

/* ---- counters ---- */
export async function listCounters(cafeId: string) {
  return prisma.counter.findMany({
    where: { cafeId },
    orderBy: { createdAt: 'asc' },
    include: { staff: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
}

export async function createCounter(cafeId: string, input: { name: string; code: string; isActive: boolean }, req: Request) {
  const exists = await prisma.counter.findUnique({ where: { cafeId_code: { cafeId, code: input.code } } });
  if (exists) throw Conflict('A counter with that code already exists');
  const counter = await prisma.counter.create({ data: { ...input, cafeId } });
  await recordActivity({ action: 'counter.created', cafeId, entityType: 'counter', entityId: counter.id, req });
  return counter;
}

export async function updateCounter(cafeId: string, counterId: string, data: Record<string, unknown>, req: Request) {
  const counter = await prisma.counter.findFirst({ where: { id: counterId, cafeId } });
  if (!counter) throw NotFound('Counter not found');
  const updated = await prisma.counter.update({ where: { id: counterId }, data });
  await recordActivity({ action: 'counter.updated', cafeId, entityType: 'counter', entityId: counterId, req });
  return updated;
}

export async function deleteCounter(cafeId: string, counterId: string, req: Request) {
  const counter = await prisma.counter.findFirst({ where: { id: counterId, cafeId }, include: { _count: { select: { orders: true, staff: true } } } });
  if (!counter) throw NotFound('Counter not found');
  if (counter._count.staff > 0) throw BadRequest('Reassign staff before deleting this counter');
  if (counter._count.orders > 0) {
    await prisma.counter.update({ where: { id: counterId }, data: { isActive: false } });
  } else {
    await prisma.counter.delete({ where: { id: counterId } });
  }
  await recordActivity({ action: 'counter.deleted', cafeId, entityType: 'counter', entityId: counterId, req });
}

/* ---- staff ---- */
export async function listStaff(cafeId: string) {
  return prisma.cafeStaff.findMany({
    where: { cafeId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true, lastLoginAt: true, status: true } },
      counter: { select: { id: true, name: true } },
    },
  });
}

export async function createStaff(
  cafeId: string,
  input: { name: string; email: string; password: string; title: string; counterId?: string | null },
  req: Request,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Conflict('A user with that email already exists');
  if (input.counterId) {
    const counter = await prisma.counter.findFirst({ where: { id: input.counterId, cafeId } });
    if (!counter) throw BadRequest('Selected counter does not belong to this cafe');
  }

  const staff = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: 'counter',
      },
    });
    return tx.cafeStaff.create({
      data: { cafeId, userId: user.id, title: input.title, counterId: input.counterId ?? null },
      include: { user: { select: { id: true, name: true, email: true } }, counter: true },
    });
  });

  await recordActivity({ action: 'staff.created', cafeId, entityType: 'staff', entityId: staff.id, req });
  return staff;
}

export async function updateStaff(cafeId: string, staffId: string, data: Record<string, unknown>, req: Request) {
  const staff = await prisma.cafeStaff.findFirst({ where: { id: staffId, cafeId } });
  if (!staff) throw NotFound('Staff member not found');
  if (data.counterId) {
    const counter = await prisma.counter.findFirst({ where: { id: data.counterId as string, cafeId } });
    if (!counter) throw BadRequest('Selected counter does not belong to this cafe');
  }
  const updated = await prisma.cafeStaff.update({
    where: { id: staffId },
    data,
    include: { user: { select: { id: true, name: true, email: true } }, counter: true },
  });
  if (typeof data.isActive === 'boolean') {
    await prisma.user.update({ where: { id: staff.userId }, data: { status: data.isActive ? 'active' : 'suspended' } });
  }
  await recordActivity({ action: 'staff.updated', cafeId, entityType: 'staff', entityId: staffId, req });
  return updated;
}

export async function removeStaff(cafeId: string, staffId: string, req: Request) {
  const staff = await prisma.cafeStaff.findFirst({ where: { id: staffId, cafeId } });
  if (!staff) throw NotFound('Staff member not found');
  await prisma.$transaction([
    prisma.cafeStaff.delete({ where: { id: staffId } }),
    prisma.user.update({ where: { id: staff.userId }, data: { status: 'suspended' } }),
    prisma.session.updateMany({ where: { userId: staff.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await recordActivity({ action: 'staff.removed', cafeId, entityType: 'staff', entityId: staffId, req });
}

/* ---- admin approval ---- */
export async function listCafesForAdmin(status?: string) {
  return prisma.cafe.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { orders: true, menuItems: true, staff: true } },
    },
  });
}

export async function reviewCafe(
  cafeId: string,
  decision: 'approve' | 'reject' | 'suspend',
  adminId: string,
  reason: string | undefined,
  req: Request,
) {
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId } });
  const statusMap = { approve: 'approved', reject: 'rejected', suspend: 'suspended' } as const;
  const nextStatus = statusMap[decision];

  const updated = await prisma.cafe.update({
    where: { id: cafeId },
    data: {
      status: nextStatus,
      rejectionReason: decision === 'approve' ? null : reason ?? null,
      reviewedById: adminId,
      reviewedAt: new Date(),
      isOpen: decision === 'approve' ? cafe.isOpen : false,
    },
  });

  await recordActivity({
    action: `cafe.${decision}d`,
    actorId: adminId,
    cafeId,
    entityType: 'cafe',
    entityId: cafeId,
    metadata: { reason },
    req,
  });

  await prisma.notification.create({
    data: {
      userId: cafe.ownerId,
      type: `cafe_${nextStatus}`,
      title:
        decision === 'approve'
          ? 'Your cafe has been approved 🎉'
          : decision === 'reject'
            ? 'Your cafe registration was rejected'
            : 'Your cafe has been suspended',
      body: decision === 'approve' ? 'You can now publish your menu and take orders.' : reason,
      data: { cafeId },
    },
  });
  emitToUser(cafe.ownerId, 'cafe:status', { cafeId, status: nextStatus, reason });

  return updated;
}
