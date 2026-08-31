import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { requireCafeAccess } from '../../middleware/cafeAccess';
import { writeLimiter } from '../../middleware/rateLimit';
import { categorySchema, itemSchema, updateCategorySchema, updateItemSchema } from './menu.schemas';
import * as svc from './menu.service';

const router = Router();

/* public */
router.get(
  '/:cafeId',
  asyncHandler(async (req, res) => ok(res, await svc.getPublicMenu(req.params.cafeId))),
);

/* owner / counter scoped */
const manage = Router({ mergeParams: true });
router.use('/:cafeId/manage', authenticate, requireRole('owner', 'admin', 'counter'), requireCafeAccess, manage);

manage.get('/', asyncHandler(async (req, res) => ok(res, await svc.getManageMenu(req.params.cafeId))));

manage.post(
  '/categories',
  requireRole('owner', 'admin'),
  validate(categorySchema),
  asyncHandler(async (req, res) => ok(res, await svc.createCategory(req.params.cafeId, req.body, req), 201)),
);
manage.patch(
  '/categories/:id',
  requireRole('owner', 'admin'),
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateCategory(req.params.cafeId, req.params.id, req.body, req))),
);
manage.delete(
  '/categories/:id',
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    await svc.deleteCategory(req.params.cafeId, req.params.id, req);
    return res.status(204).send();
  }),
);

manage.post(
  '/items',
  writeLimiter,
  requireRole('owner', 'admin'),
  validate(itemSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createItem(req.params.cafeId, req.body, req), 201)),
);
// counters may toggle availability, owners may edit everything
manage.patch(
  '/items/:id',
  validate(updateItemSchema),
  asyncHandler(async (req, res) => {
    if (req.auth!.role === 'counter') {
      const allowed = ['isAvailable'];
      for (const key of Object.keys(req.body)) {
        if (!allowed.includes(key)) delete req.body[key];
      }
    }
    return ok(res, await svc.updateItem(req.params.cafeId, req.params.id, req.body, req));
  }),
);
manage.delete(
  '/items/:id',
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    await svc.deleteItem(req.params.cafeId, req.params.id, req);
    return res.status(204).send();
  }),
);

export default router;
