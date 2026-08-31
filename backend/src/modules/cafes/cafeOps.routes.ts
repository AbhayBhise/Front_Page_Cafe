import { Router } from 'express';
import { asyncHandler, ok, paginated } from '../../lib/http';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { requireCafeAccess } from '../../middleware/cafeAccess';
import { prisma } from '../../lib/prisma';
import { presence } from '../../realtime/presence';
import { cafeOrdersQuery } from '../orders/orders.schemas';
import * as orders from '../orders/orders.service';
import * as analytics from '../analytics/analytics.service';

/** Mounted at /api/cafes/:cafeId — accessible to owner, counter and admin. */
const router = Router({ mergeParams: true });
router.use(authenticate, requireRole('owner', 'counter', 'admin'), requireCafeAccess);

router.get(
  '/orders',
  validate(cafeOrdersQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as { status?: string; scope: 'active' | 'today' | 'all'; page: number; pageSize: number };
    const { total, items, kitchenLoad } = await orders.listCafeOrders(req.params.cafeId, q);
    return res.json({ data: items, meta: { total, page: q.page, pageSize: q.pageSize, pages: Math.ceil(total / q.pageSize) || 1 }, kitchenLoad });
  }),
);

router.get('/presence', asyncHandler(async (req, res) => ok(res, {
  staff: presence.list(req.params.cafeId),
  onlineCount: presence.onlineCount(req.params.cafeId),
})));

router.get('/analytics/overview', asyncHandler(async (req, res) => ok(res, await analytics.cafeOverview(req.params.cafeId))));
router.get('/analytics/timeseries', asyncHandler(async (req, res) =>
  ok(res, await analytics.cafeTimeseries(req.params.cafeId, Math.min(Number(req.query.days) || 7, 90))),
));
router.get('/analytics/top-items', asyncHandler(async (req, res) =>
  ok(res, await analytics.cafeTopItems(req.params.cafeId, Math.min(Number(req.query.limit) || 10, 50))),
));

router.get(
  '/activity',
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 30, 100);
    const where = { cafeId: req.params.cafeId };
    const [total, items] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return paginated(res, items, { total, page, pageSize });
  }),
);

export default router;
