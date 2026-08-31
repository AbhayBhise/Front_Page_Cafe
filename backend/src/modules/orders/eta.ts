import { prisma } from '../../lib/prisma';

/**
 * USP — Kitchen Load-Aware ETA & live queue position.
 * The ready-time estimate reflects how busy the kitchen actually is right now:
 * every order still in pending/accepted/preparing adds its slowest item's prep
 * time to the backlog, divided across an assumed number of parallel stations.
 */
const PARALLEL_STATIONS = 2;

export async function computeKitchenLoad(cafeId: string) {
  const active = await prisma.order.findMany({
    where: { cafeId, status: { in: ['pending', 'accepted', 'preparing'] } },
    select: { id: true, placedAt: true, items: { select: { menuItem: { select: { prepMinutes: true } }, quantity: true } } },
    orderBy: { placedAt: 'asc' },
  });

  const backlogMinutes = active.reduce((sum, o) => {
    const slowest = o.items.reduce((m, it) => Math.max(m, it.menuItem.prepMinutes), 0);
    return sum + slowest;
  }, 0);

  return {
    activeOrders: active.length,
    backlogMinutes,
    queue: active.map((o) => o.id),
  };
}

export function estimateReadyAt(params: {
  backlogMinutes: number;
  queueAhead: number;
  ownItemsSlowestPrep: number;
}): { readyAt: Date; etaMinutes: number } {
  const etaMinutes = Math.max(
    params.ownItemsSlowestPrep,
    Math.round(params.backlogMinutes / PARALLEL_STATIONS) + params.ownItemsSlowestPrep,
  );
  return { readyAt: new Date(Date.now() + etaMinutes * 60_000), etaMinutes };
}

export async function queuePosition(cafeId: string, orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { placedAt: true, status: true } });
  if (!order || !['pending', 'accepted', 'preparing'].includes(order.status)) return 0;
  const ahead = await prisma.order.count({
    where: { cafeId, status: { in: ['pending', 'accepted', 'preparing'] }, placedAt: { lt: order.placedAt } },
  });
  return ahead + 1;
}
