import { prisma } from '../../lib/prisma';
import { presence } from '../../realtime/presence';
import { computeKitchenLoad } from '../orders/eta';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysAgo(n: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

export async function cafeOverview(cafeId: string) {
  const today = startOfToday();
  const [statusGroups, todayAgg, allTimeAgg, completed, load] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where: { cafeId }, _count: true }),
    prisma.order.aggregate({
      where: { cafeId, placedAt: { gte: today }, status: { notIn: ['cancelled', 'rejected'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { cafeId, status: { notIn: ['cancelled', 'rejected'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { cafeId, status: 'completed', acceptedAt: { not: null }, completedAt: { not: null } },
      select: { acceptedAt: true, completedAt: true },
      take: 200,
      orderBy: { completedAt: 'desc' },
    }),
    computeKitchenLoad(cafeId),
  ]);

  const avgPrepMinutes =
    completed.length > 0
      ? Math.round(
          completed.reduce((s, o) => s + (o.completedAt!.getTime() - o.acceptedAt!.getTime()) / 60000, 0) /
            completed.length,
        )
      : null;

  const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count]));
  const distinctCustomers = await prisma.order.findMany({
    where: { cafeId },
    distinct: ['customerId'],
    select: { customerId: true },
  });

  return {
    todayRevenue: todayAgg._sum.total ?? 0,
    todayOrders: todayAgg._count,
    lifetimeRevenue: allTimeAgg._sum.total ?? 0,
    lifetimeOrders: allTimeAgg._count,
    totalCustomers: distinctCustomers.length,
    statusCounts,
    activeOrders: (statusCounts.pending ?? 0) + (statusCounts.accepted ?? 0) + (statusCounts.preparing ?? 0) + (statusCounts.ready ?? 0),
    avgPrepMinutes,
    kitchenLoad: load,
    staffOnline: presence.onlineCount(cafeId),
  };
}

export async function cafeTimeseries(cafeId: string, days: number) {
  const since = daysAgo(days - 1);
  const orders = await prisma.order.findMany({
    where: { cafeId, placedAt: { gte: since }, status: { notIn: ['cancelled', 'rejected'] } },
    select: { placedAt: true, total: true },
  });
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i += 1) {
    const d = daysAgo(days - 1 - i);
    buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.placedAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.revenue += o.total;
      b.orders += 1;
    }
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, ...v, revenue: Number(v.revenue.toFixed(2)) }));
}

export async function cafeTopItems(cafeId: string, limit: number) {
  const grouped = await prisma.orderItem.groupBy({
    by: ['menuItemId', 'nameSnapshot'],
    where: { order: { cafeId, status: { notIn: ['cancelled', 'rejected'] } } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });
  return grouped.map((g) => ({
    menuItemId: g.menuItemId,
    name: g.nameSnapshot,
    unitsSold: g._sum.quantity ?? 0,
    revenue: Number((g._sum.lineTotal ?? 0).toFixed(2)),
  }));
}

export async function platformOverview() {
  const today = startOfToday();
  const [usersByRole, cafesByStatus, orderAgg, todayAgg, activeCafes] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.cafe.groupBy({ by: ['status'], _count: true }),
    prisma.order.aggregate({ where: { status: { notIn: ['cancelled', 'rejected'] } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({
      where: { placedAt: { gte: today }, status: { notIn: ['cancelled', 'rejected'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.cafe.count({ where: { status: 'approved', isOpen: true } }),
  ]);

  return {
    users: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
    totalUsers: usersByRole.reduce((s, r) => s + r._count, 0),
    cafes: Object.fromEntries(cafesByStatus.map((c) => [c.status, c._count])),
    pendingApprovals: cafesByStatus.find((c) => c.status === 'pending')?._count ?? 0,
    liveCafes: activeCafes,
    gmv: orderAgg._sum.total ?? 0,
    totalOrders: orderAgg._count,
    todayGmv: todayAgg._sum.total ?? 0,
    todayOrders: todayAgg._count,
  };
}

export async function platformTimeseries(days: number) {
  const since = daysAgo(days - 1);
  const [orders, signups] = await Promise.all([
    prisma.order.findMany({
      where: { placedAt: { gte: since }, status: { notIn: ['cancelled', 'rejected'] } },
      select: { placedAt: true, total: true },
    }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);
  const buckets = new Map<string, { gmv: number; orders: number; signups: number }>();
  for (let i = 0; i < days; i += 1) {
    buckets.set(daysAgo(days - 1 - i).toISOString().slice(0, 10), { gmv: 0, orders: 0, signups: 0 });
  }
  for (const o of orders) {
    const b = buckets.get(o.placedAt.toISOString().slice(0, 10));
    if (b) {
      b.gmv += o.total;
      b.orders += 1;
    }
  }
  for (const u of signups) {
    const b = buckets.get(u.createdAt.toISOString().slice(0, 10));
    if (b) b.signups += 1;
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, ...v, gmv: Number(v.gmv.toFixed(2)) }));
}
