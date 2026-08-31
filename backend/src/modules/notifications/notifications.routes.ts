import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http';
import { authenticate } from '../../middleware/authenticate';
import { prisma } from '../../lib/prisma';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.notification.findMany({
      where: { userId: req.auth!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = await prisma.notification.count({ where: { userId: req.auth!.id, readAt: null } });
    return res.json({ data: items, meta: { unread } });
  }),
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth!.id },
      data: { readAt: new Date() },
    });
    return ok(res, { success: true });
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.id, readAt: null },
      data: { readAt: new Date() },
    });
    return ok(res, { success: true });
  }),
);

export default router;
