import { Router } from 'express';
import { asyncHandler, ok, paginated } from '../../lib/http';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { writeLimiter } from '../../middleware/rateLimit';
import {
  cancelSchema,
  createOrderSchema,
  listMineQuery,
  transitionSchema,
} from './orders.schemas';
import * as svc from './orders.service';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  writeLimiter,
  requireRole('customer'),
  validate(createOrderSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createOrder(req.auth!.id, req.body, req), 201)),
);

router.get(
  '/mine',
  requireRole('customer'),
  validate(listMineQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as { status?: never; page: number; pageSize: number };
    const { total, items } = await svc.listMine(req.auth!.id, q);
    return paginated(res, items, { total, page: q.page, pageSize: q.pageSize });
  }),
);

router.get(
  '/:orderId',
  asyncHandler(async (req, res) => ok(res, await svc.getOne(req.params.orderId, req))),
);

router.post(
  '/:orderId/transition',
  requireRole('counter', 'owner', 'admin'),
  validate(transitionSchema),
  asyncHandler(async (req, res) =>
    ok(res, await svc.transition(req.params.orderId, req.body.status, req.body.note, req)),
  ),
);

router.post(
  '/:orderId/cancel',
  requireRole('customer'),
  validate(cancelSchema),
  asyncHandler(async (req, res) =>
    ok(res, await svc.cancelByCustomer(req.params.orderId, req.auth!.id, req.body.reason, req)),
  ),
);

export default router;
