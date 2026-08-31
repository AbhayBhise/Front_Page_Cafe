import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, paginated } from '../../lib/http';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { prisma } from '../../lib/prisma';
import { recordActivity } from '../../lib/activity';
import { BadRequest } from '../../lib/errors';
import { emitToUser } from '../../realtime/io';
import * as cafes from '../cafes/cafes.service';
import * as analytics from '../analytics/analytics.service';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/overview', asyncHandler(async (_req, res) => ok(res, await analytics.platformOverview())));

router.get(
  '/analytics/timeseries',
  asyncHandler(async (req, res) => ok(res, await analytics.platformTimeseries(Math.min(Number(req.query.days) || 14, 90)))),
);

router.get(
  '/cafes',
  asyncHandler(async (req, res) => ok(res, await cafes.listCafesForAdmin(req.query.status as string | undefined))),
);

const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject', 'suspend']),
  reason: z.string().min(3).max(300).optional(),
});
router.post(
  '/cafes/:cafeId/review',
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    if (req.body.decision !== 'approve' && !req.body.reason) {
      throw BadRequest('A reason is required to reject or suspend a cafe');
    }
    return ok(res, await cafes.reviewCafe(req.params.cafeId, req.body.decision, req.auth!.id, req.body.reason, req));
  }),
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 100);
    const q = (req.query.q as string | undefined)?.trim();
    const role = req.query.role as string | undefined;
    const where = {
      ...(role ? { role: role as never } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, role: true, status: true,
          lastLoginAt: true, createdAt: true,
          _count: { select: { orders: true, ownedCafes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return paginated(res, items, { total, page, pageSize });
  }),
);

const updateUserSchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
  role: z.enum(['customer', 'counter', 'owner', 'admin']).optional(),
});
router.patch(
  '/users/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.auth!.id) throw BadRequest('You cannot modify your own account here');
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    if (req.body.status === 'suspended') {
      await prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      emitToUser(user.id, 'account:suspended', {});
    }
    await recordActivity({ action: 'admin.user_updated', entityType: 'user', entityId: user.id, metadata: req.body, req });
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return ok(res, safe);
  }),
);

router.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 40, 100);
    const action = req.query.action as string | undefined;
    const where = action ? { action: { startsWith: action } } : {};
    const [total, items] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, role: true } },
          cafe: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return paginated(res, items, { total, page, pageSize });
  }),
);

export default router;
