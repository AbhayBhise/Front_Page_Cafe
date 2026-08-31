import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { asyncHandler, ok } from '../../lib/http';
import { validate } from '../../middleware/validate';
import * as svc from './qr.service';

const router = Router();

const sessionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many attempts — please wait a moment' } },
});

const bodySchema = z.object({
  cafeSlug: z.string().min(1).max(80),
  tableCode: z.string().min(1).max(40),
  k: z.string().min(10).max(128),
});

// Validate a QR without creating a session (used to render the landing page).
router.post(
  '/resolve',
  sessionLimiter,
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const { cafe, table } = await svc.resolveTable(req.body.cafeSlug, req.body.tableCode, req.body.k);
    return ok(res, { cafe, table: { id: table.id, label: table.label } });
  }),
);

// Start a quick-dine guest session — the only way to obtain a guest token.
router.post(
  '/session',
  sessionLimiter,
  validate(bodySchema),
  asyncHandler(async (req, res) =>
    ok(res, await svc.startGuestSession(req.body.cafeSlug, req.body.tableCode, req.body.k, req), 201),
  ),
);

export default router;
