import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value && value.trim() !== '') return value;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

const DEV_SECRETS = new Set([
  'dev_access_secret',
  'dev_refresh_secret',
  'dev_access_secret_change_me_in_production_0a1b2c3d',
  'dev_refresh_secret_change_me_in_production_9z8y7x6w',
]);

function secret(name: string): string {
  const value = required(name, isProd ? undefined : `dev_${name.toLowerCase()}`);
  if (isProd && (DEV_SECRETS.has(value) || value.length < 24)) {
    throw new Error(
      `${name} looks like a development placeholder. Set a strong unique value in production ` +
        `(e.g. \`openssl rand -base64 48\`).`,
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd,
  port: Number(process.env.PORT ?? 5000),
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  publicWebUrl: (process.env.PUBLIC_WEB_URL ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')[0]
    .trim()
    .replace(/\/$/, ''),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    accessSecret: secret('JWT_ACCESS_SECRET'),
    refreshSecret: secret('JWT_REFRESH_SECRET'),
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
    guestTtl: process.env.GUEST_TOKEN_TTL ?? '4h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@frontpagecafe.com',
    password:
      process.env.ADMIN_PASSWORD ??
      (isProd ? crypto.randomBytes(12).toString('base64url') : 'Admin@12345'),
    name: process.env.ADMIN_NAME ?? 'Platform Admin',
  },
  paymentsMode: process.env.PAYMENTS_MODE ?? 'simulated',
};
