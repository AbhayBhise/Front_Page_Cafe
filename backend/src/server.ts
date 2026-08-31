import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { initRealtime } from './realtime/io';
import { ensureBootstrapAdmin } from './bootstrap';

async function main() {
  await prisma.$connect();
  await ensureBootstrapAdmin();

  const app = createApp();
  const httpServer = createServer(app);
  initRealtime(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}`, { env: env.nodeEnv });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { err: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
