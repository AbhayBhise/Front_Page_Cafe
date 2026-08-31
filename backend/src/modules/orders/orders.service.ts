import type { Request } from 'express';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BadRequest, Forbidden, NotFound } from '../../lib/errors';
import { recordActivity } from '../../lib/activity';
import { emitToCafe, emitToUser } from '../../realtime/io';
import { charge, refund } from './payment';
import { computeKitchenLoad, estimateReadyAt, queuePosition } from './eta';

const ACTIVE: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'rejected'],
  preparing: ['ready'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
  rejected: [],
};

const orderInclude = {
  items: { include: { menuItem: { select: { id: true, name: true, imageUrl: true } } } },
  events: { orderBy: { createdAt: 'asc' as const } },
  cafe: { select: { id: true, name: true, slug: true, phone: true, currency: true } },
  counter: { select: { id: true, name: true } },
  table: { select: { id: true, label: true } },
  customer: { select: { id: true, name: true, email: true, phone: true } },
};

export async function withLiveMeta<T extends { id: string; cafeId: string; status: OrderStatus; items: { menuItem?: unknown }[] }>(
  order: T,
) {
  if (!ACTIVE.includes(order.status) || order.status === 'ready') {
    return { ...order, queuePosition: 0 };
  }
  const position = await queuePosition(order.cafeId, order.id);
  return { ...order, queuePosition: position };
}

export async function createOrder(customerId: string, input: any, req: Request) {
  const isGuest = req.auth?.guest === true;
  let tableId: string | undefined;
  let tableLabel: string | undefined;

  if (isGuest) {
    // QR quick-dine: the cafe/table are fixed by the guest token, not the client.
    if (!req.auth?.cafeId || !req.auth?.tableId) throw Forbidden('Invalid quick-dine session');
    input.cafeId = req.auth.cafeId;
    const table = await prisma.table.findUnique({ where: { id: req.auth.tableId } });
    if (!table || !table.isActive) throw BadRequest('This table is no longer active');
    tableId = table.id;
    tableLabel = table.label;
    input.fulfillmentType = 'dine_in';
    if (!input.customerName?.trim() || !input.customerPhone?.trim()) {
      throw BadRequest('Please add your name and phone number');
    }
    const activeAtTable = await prisma.order.count({
      where: { tableId: table.id, status: { in: ['pending', 'accepted', 'preparing', 'ready'] } },
    });
    if (activeAtTable >= 6) throw BadRequest('There are already several open orders for this table — please ask staff.');
  } else if (!input.cafeId) {
    throw BadRequest('cafeId is required');
  }

  const cafe = await prisma.cafe.findUnique({ where: { id: input.cafeId } });
  if (!cafe || cafe.status !== 'approved') throw NotFound('Cafe is not available for ordering');
  if (!cafe.isOpen) throw BadRequest('This cafe is currently closed');

  const ids: string[] = input.items.map((i: any) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids }, cafeId: cafe.id } });
  if (menuItems.length !== new Set(ids).size) throw BadRequest('One or more items are no longer on the menu');

  const byId = new Map(menuItems.map((m) => [m.id, m]));
  let subtotal = 0;
  let slowestPrep = 0;
  const lineItems = input.items.map((line: any) => {
    const mi = byId.get(line.menuItemId)!;
    if (!mi.isAvailable) throw BadRequest(`"${mi.name}" is currently unavailable`);
    const lineTotal = Number((mi.price * line.quantity).toFixed(2));
    subtotal += lineTotal;
    slowestPrep = Math.max(slowestPrep, mi.prepMinutes);
    return {
      menuItemId: mi.id,
      nameSnapshot: mi.name,
      priceSnapshot: mi.price,
      quantity: line.quantity,
      lineTotal,
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  const taxAmount = Number(((subtotal * cafe.taxRate) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  const payment = await charge({ method: input.payment.method, amount: total, token: input.payment.token });
  if (payment.status === 'failed') throw BadRequest('Payment was declined. Please try another method.');

  const load = await computeKitchenLoad(cafe.id);
  const { etaMinutes } = estimateReadyAt({
    backlogMinutes: load.backlogMinutes,
    queueAhead: load.activeOrders,
    ownItemsSlowestPrep: slowestPrep,
  });

  const order = await prisma.order.create({
    data: {
      cafeId: cafe.id,
      customerId,
      status: 'pending',
      channel: isGuest ? 'qr' : 'web',
      tableId,
      fulfillmentType: input.fulfillmentType,
      tableNumber: isGuest ? tableLabel : input.tableNumber,
      notes: input.notes,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      paymentStatus: payment.status,
      paymentRef: payment.ref,
      paymentMethod: payment.method,
      subtotal,
      taxAmount,
      total,
      items: { create: lineItems },
      events: { create: { status: 'pending', note: `Order placed · ETA ~${etaMinutes} min` } },
    },
    include: orderInclude,
  });

  if (isGuest && input.customerName) {
    await prisma.user.update({
      where: { id: customerId },
      data: { name: input.customerName.trim(), phone: input.customerPhone?.trim() },
    });
  }

  await recordActivity({
    action: isGuest ? 'order.placed_qr' : 'order.placed',
    actorId: customerId,
    cafeId: cafe.id,
    entityType: 'order',
    entityId: order.id,
    metadata: { total, itemCount: lineItems.length, payment: payment.status, table: tableLabel },
    req,
  });

  const position = await queuePosition(cafe.id, order.id);
  const enriched = { ...order, etaMinutes, queuePosition: position };

  emitToCafe(cafe.id, 'order:new', enriched);
  await prisma.notification.create({
    data: {
      userId: cafe.ownerId,
      type: 'order_new',
      title: `New order #${order.orderNumber}`,
      body: `${lineItems.length} item(s) · ${cafe.currency} ${total}`,
      data: { orderId: order.id },
    },
  });

  return enriched;
}

export async function listMine(customerId: string, q: { status?: OrderStatus; page: number; pageSize: number }) {
  const where = { customerId, ...(q.status ? { status: q.status } : {}) };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  const items = await Promise.all(orders.map((o) => withLiveMeta(o as never)));
  return { total, items };
}

export async function getOne(orderId: string, req: Request) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw NotFound('Order not found');

  const auth = req.auth!;
  if (auth.role === 'customer' && order.customerId !== auth.id) throw Forbidden();
  if (auth.role === 'counter') {
    const staff = await prisma.cafeStaff.findUnique({ where: { userId: auth.id } });
    if (staff?.cafeId !== order.cafeId) throw Forbidden();
  }
  if (auth.role === 'owner') {
    const cafe = await prisma.cafe.findUnique({ where: { id: order.cafeId } });
    if (cafe?.ownerId !== auth.id) throw Forbidden();
  }
  return withLiveMeta(order as never);
}

export async function listCafeOrders(
  cafeId: string,
  q: { status?: string; scope: 'active' | 'today' | 'all'; page: number; pageSize: number },
) {
  const statusFilter = q.status
    ? { status: { in: q.status.split(',').filter(Boolean) as OrderStatus[] } }
    : q.scope === 'active'
      ? { status: { in: ACTIVE } }
      : {};
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const where = {
    cafeId,
    ...statusFilter,
    ...(q.scope === 'today' ? { placedAt: { gte: startOfDay } } : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: q.scope === 'active' ? { placedAt: 'asc' } : { placedAt: 'desc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  const items = await Promise.all(orders.map((o) => withLiveMeta(o as never)));
  const load = await computeKitchenLoad(cafeId);
  return { total, items, kitchenLoad: load };
}

export async function transition(orderId: string, next: OrderStatus, note: string | undefined, req: Request) {
  const auth = req.auth!;
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { cafe: true } });
  if (!order) throw NotFound('Order not found');

  // access check
  if (auth.role === 'counter') {
    const staff = await prisma.cafeStaff.findUnique({ where: { userId: auth.id } });
    if (staff?.cafeId !== order.cafeId || !staff?.isActive) throw Forbidden();
  } else if (auth.role === 'owner') {
    if (order.cafe.ownerId !== auth.id) throw Forbidden();
  } else if (auth.role !== 'admin') {
    throw Forbidden();
  }

  if (!TRANSITIONS[order.status].includes(next)) {
    throw BadRequest(`Cannot move an order from ${order.status} to ${next}`);
  }

  const now = new Date();
  const data: Record<string, unknown> = { status: next };
  if (next === 'accepted') {
    data.acceptedAt = now;
    data.handledById = auth.id;
    const staff = auth.role === 'counter' ? await prisma.cafeStaff.findUnique({ where: { userId: auth.id } }) : null;
    if (staff?.counterId) data.counterId = staff.counterId;
  }
  if (next === 'ready') data.readyAt = now;
  if (next === 'completed') {
    data.completedAt = now;
    if (order.paymentStatus === 'unpaid') data.paymentStatus = 'paid';
  }
  if (next === 'rejected') {
    data.cancelReason = note ?? 'Rejected by cafe';
    if (order.paymentStatus === 'paid' && order.paymentRef) {
      const r = await refund(order.paymentRef);
      data.paymentStatus = 'refunded';
      data.paymentRef = r.ref;
    }
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { ...data, events: { create: { status: next, note, actorId: auth.id } } },
    include: orderInclude,
  });

  await recordActivity({
    action: `order.${next}`,
    actorId: auth.id,
    cafeId: order.cafeId,
    entityType: 'order',
    entityId: orderId,
    metadata: { note },
    req,
  });

  const enriched = await withLiveMeta(updated as never);
  emitToCafe(order.cafeId, 'order:updated', enriched);
  emitToUser(order.customerId, 'order:updated', enriched);
  await prisma.notification.create({
    data: {
      userId: order.customerId,
      type: `order_${next}`,
      title: `Order #${order.orderNumber} ${next}`,
      body:
        next === 'ready'
          ? 'Your order is ready for pickup!'
          : next === 'rejected'
            ? note ?? 'The cafe could not accept your order'
            : `Status updated to ${next}`,
      data: { orderId },
    },
  });

  return enriched;
}

export async function cancelByCustomer(orderId: string, customerId: string, reason: string | undefined, req: Request) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw NotFound('Order not found');
  if (order.customerId !== customerId) throw Forbidden();
  if (order.status !== 'pending') throw BadRequest('Only pending orders can be cancelled');

  const data: Record<string, unknown> = { status: 'cancelled', cancelReason: reason ?? 'Cancelled by customer' };
  if (order.paymentStatus === 'paid' && order.paymentRef) {
    const r = await refund(order.paymentRef);
    data.paymentStatus = 'refunded';
    data.paymentRef = r.ref;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { ...data, events: { create: { status: 'cancelled', note: reason, actorId: customerId } } },
    include: orderInclude,
  });

  await recordActivity({ action: 'order.cancelled', actorId: customerId, cafeId: order.cafeId, entityType: 'order', entityId: orderId, req });
  emitToCafe(order.cafeId, 'order:updated', updated);
  return withLiveMeta(updated as never);
}
