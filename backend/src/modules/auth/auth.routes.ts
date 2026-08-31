import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http';
import { validate } from '../../middleware/validate';
import { authenticate, blockGuests } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimit';
import { prisma } from '../../lib/prisma';
import { recordActivity } from '../../lib/activity';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateMeSchema,
} from './auth.schemas';
import * as authService from './auth.service';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => ok(res, await authService.register(req.body, req), 201)),
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => ok(res, await authService.login(req.body, req))),
);

router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => ok(res, await authService.refresh(req.body.refreshToken, req))),
);

router.post(
  '/logout',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    return ok(res, { success: true });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => ok(res, await authService.buildIdentity(req.auth!.id))),
);

router.patch(
  '/me',
  authenticate,
  blockGuests,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.auth!.id }, data: req.body });
    await recordActivity({ action: 'user.profile_updated', req });
    return ok(res, await authService.buildIdentity(req.auth!.id));
  }),
);

router.post(
  '/change-password',
  authenticate,
  blockGuests,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.auth!.id, req.body.currentPassword, req.body.newPassword, req);
    return ok(res, { success: true });
  }),
);

router.get(
  '/sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const sessions = await prisma.session.findMany({
      where: { userId: req.auth!.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
    });
    return ok(res, sessions);
  }),
);

export default router;
