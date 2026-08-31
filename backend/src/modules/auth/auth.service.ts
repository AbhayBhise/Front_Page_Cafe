import type { z } from 'zod';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../../lib/auth-tokens';
import { BadRequest, Conflict, Forbidden, Unauthorized } from '../../lib/errors';
import { slugify, uniqueSlug } from '../../lib/slug';
import { recordActivity } from '../../lib/activity';
import type { loginSchema, registerSchema } from './auth.schemas';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

async function issueSession(userId: string, req: Request) {
  const { token: refreshToken, hash, expiresAt } = generateRefreshToken();
  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hash,
      expiresAt,
      userAgent: req.headers['user-agent']?.slice(0, 250),
      ip: req.ip,
    },
  });
  return { refreshToken, expiresAt };
}

export async function buildIdentity(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      ownedCafes: { orderBy: { createdAt: 'asc' } },
      staffProfile: { include: { cafe: true, counter: true } },
    },
  });

  const { passwordHash, ...safe } = user;
  void passwordHash;

  const cafe =
    user.role === 'owner'
      ? user.ownedCafes[0] ?? null
      : user.role === 'counter'
        ? user.staffProfile?.cafe ?? null
        : null;

  return {
    user: safe,
    cafe,
    staff: user.staffProfile
      ? {
          id: user.staffProfile.id,
          title: user.staffProfile.title,
          counterId: user.staffProfile.counterId,
          counterName: user.staffProfile.counter?.name ?? null,
          isActive: user.staffProfile.isActive,
        }
      : null,
  };
}

function tokensFor(user: { id: string; email: string; role: 'customer' | 'counter' | 'owner' | 'admin' }) {
  return { accessToken: signAccessToken({ sub: user.id, email: user.email, role: user.role }) };
}

export async function register(input: RegisterInput, req: Request) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Conflict('An account with that email already exists');

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
      },
    });

    if (input.role === 'owner' && input.cafe) {
      const slug = await uniqueSlug(input.cafe.name, async (s) =>
        Boolean(await tx.cafe.findUnique({ where: { slug: s } })),
      );
      await tx.cafe.create({
        data: {
          name: input.cafe.name,
          slug: slug || slugify(`${input.cafe.name}-${created.id.slice(0, 5)}`),
          ownerId: created.id,
          phone: input.cafe.phone,
          email: input.email,
          addressLine: input.cafe.addressLine,
          city: input.cafe.city,
          state: input.cafe.state,
          postalCode: input.cafe.postalCode,
          gstNumber: input.cafe.gstNumber,
          licenseNumber: input.cafe.licenseNumber,
          description: input.cafe.description,
          status: 'pending',
        },
      });
    }
    return created;
  });

  await recordActivity({
    action: input.role === 'owner' ? 'cafe.registration_submitted' : 'user.registered',
    actorId: user.id,
    req,
  });

  const { refreshToken } = await issueSession(user.id, req);
  const identity = await buildIdentity(user.id);
  return { ...tokensFor(user), refreshToken, ...identity };
}

export async function login(input: LoginInput, req: Request) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw Unauthorized('Invalid email or password');
  if (user.status === 'suspended') throw Forbidden('Your account has been suspended');

  const okPw = await verifyPassword(input.password, user.passwordHash);
  if (!okPw) {
    await recordActivity({ action: 'auth.login_failed', actorId: user.id, req });
    throw Unauthorized('Invalid email or password');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await recordActivity({ action: 'auth.login', actorId: user.id, req });

  const { refreshToken } = await issueSession(user.id, req);
  const identity = await buildIdentity(user.id);
  return { ...tokensFor(user), refreshToken, ...identity };
}

export async function refresh(refreshToken: string, req: Request) {
  const hash = hashToken(refreshToken);
  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hash }, include: { user: true } });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw Unauthorized('Session expired, please sign in again');
  }
  if (session.user.status === 'suspended') throw Forbidden('Your account has been suspended');

  // rotate
  const rotated = generateRefreshToken();
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
  await prisma.session.create({
    data: {
      userId: session.userId,
      refreshTokenHash: rotated.hash,
      expiresAt: rotated.expiresAt,
      userAgent: req.headers['user-agent']?.slice(0, 250),
      ip: req.ip,
    },
  });

  const identity = await buildIdentity(session.userId);
  return { ...tokensFor(session.user), refreshToken: rotated.token, ...identity };
}

export async function logout(refreshToken: string) {
  const hash = hashToken(refreshToken);
  await prisma.session.updateMany({
    where: { refreshTokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, req: Request) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const okPw = await verifyPassword(currentPassword, user.passwordHash);
  if (!okPw) throw BadRequest('Current password is incorrect');
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  // revoke all other sessions
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  await recordActivity({ action: 'auth.password_changed', actorId: userId, req });
}
