import { env } from './config/env';
import { prisma } from './lib/prisma';
import { hashPassword } from './lib/password';
import { logger } from './lib/logger';

/** Guarantee a platform admin exists so the system is usable on first boot. */
export async function ensureBootstrapAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (existing) return;

  await prisma.user.create({
    data: {
      name: env.admin.name,
      email: env.admin.email,
      passwordHash: await hashPassword(env.admin.password),
      role: 'admin',
    },
  });

  logger.info('Bootstrap admin account created', { email: env.admin.email });
  if (!process.env.ADMIN_PASSWORD) {
    // A random password was generated — surface it once so the operator can log in.
    logger.warn('Generated a random admin password — save it now, it will not be shown again', {
      email: env.admin.email,
      password: env.admin.password,
    });
  }
}
