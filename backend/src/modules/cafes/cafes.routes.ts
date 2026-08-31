import { Router } from 'express';
import { asyncHandler, ok, paginated } from '../../lib/http';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { requireCafeAccess } from '../../middleware/cafeAccess';
import { writeLimiter } from '../../middleware/rateLimit';
import {
  counterSchema,
  createStaffSchema,
  listCafesQuery,
  tableSchema,
  toggleOpenSchema,
  updateCafeSchema,
  updateCounterSchema,
  updateStaffSchema,
  updateTableSchema,
} from './cafes.schemas';
import * as svc from './cafes.service';
import cafeOpsRouter from './cafeOps.routes';

const router = Router();

/* -------- public discovery -------- */
router.get(
  '/',
  validate(listCafesQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as { q?: string; city?: string; page: number; pageSize: number };
    const { total, items } = await svc.listPublicCafes(q);
    return paginated(res, items, { total, page: q.page, pageSize: q.pageSize });
  }),
);

/* -------- owner: my cafe -------- */
router.get(
  '/mine',
  authenticate,
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => ok(res, await svc.getOwnerCafe(req.auth!.id))),
);

router.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => ok(res, await svc.getPublicCafe(req.params.idOrSlug))),
);

/* -------- cafe operations (owner + counter + admin) -------- */
router.use('/:cafeId', cafeOpsRouter);

/* -------- owner scoped management -------- */
const owner = Router({ mergeParams: true });
router.use('/:cafeId', authenticate, requireRole('owner', 'admin'), requireCafeAccess, owner);

owner.patch(
  '/',
  writeLimiter,
  validate(updateCafeSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateCafe(req.params.cafeId, req.body, req))),
);

owner.post(
  '/toggle-open',
  validate(toggleOpenSchema),
  asyncHandler(async (req, res) => ok(res, await svc.setOpen(req.params.cafeId, req.body.isOpen, req))),
);

owner.get('/counters', asyncHandler(async (req, res) => ok(res, await svc.listCounters(req.params.cafeId))));
owner.post(
  '/counters',
  validate(counterSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createCounter(req.params.cafeId, req.body, req), 201)),
);
owner.patch(
  '/counters/:counterId',
  validate(updateCounterSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateCounter(req.params.cafeId, req.params.counterId, req.body, req))),
);
owner.delete(
  '/counters/:counterId',
  asyncHandler(async (req, res) => {
    await svc.deleteCounter(req.params.cafeId, req.params.counterId, req);
    return res.status(204).send();
  }),
);

owner.get('/tables', asyncHandler(async (req, res) => ok(res, await svc.listTables(req.params.cafeId))));
owner.post(
  '/tables',
  validate(tableSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createTable(req.params.cafeId, req.body, req), 201)),
);
owner.patch(
  '/tables/:tableId',
  validate(updateTableSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateTable(req.params.cafeId, req.params.tableId, req.body, req))),
);
owner.post(
  '/tables/:tableId/rotate',
  asyncHandler(async (req, res) => ok(res, await svc.rotateTableSecret(req.params.cafeId, req.params.tableId, req))),
);
owner.delete(
  '/tables/:tableId',
  asyncHandler(async (req, res) => {
    await svc.deleteTable(req.params.cafeId, req.params.tableId, req);
    return res.status(204).send();
  }),
);

owner.get('/staff', asyncHandler(async (req, res) => ok(res, await svc.listStaff(req.params.cafeId))));
owner.post(
  '/staff',
  validate(createStaffSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createStaff(req.params.cafeId, req.body, req), 201)),
);
owner.patch(
  '/staff/:staffId',
  validate(updateStaffSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateStaff(req.params.cafeId, req.params.staffId, req.body, req))),
);
owner.delete(
  '/staff/:staffId',
  asyncHandler(async (req, res) => {
    await svc.removeStaff(req.params.cafeId, req.params.staffId, req);
    return res.status(204).send();
  }),
);

export default router;
