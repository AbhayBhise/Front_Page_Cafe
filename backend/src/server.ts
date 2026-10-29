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
    logger.info(`Received ${signal}, initiating graceful shutdown...`);

    // Force exit after 10s if connections refuse to drain
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s, forcing exit');
      process.exit(1);
    }, 10000);
    if (forceExitTimer.unref) forceExitTimer.unref();

    httpServer.close(async (err) => {
      if (err) {
        logger.error('Error while closing HTTP server', { error: String(err) });
      } else {
        logger.info('HTTP server closed, all connections drained');
      }

      try {
        await prisma.$disconnect();
        logger.info('Prisma database connection pool disconnected');
      } catch (dbErr) {
        logger.error('Error disconnecting Prisma', { error: String(dbErr) });
      }

      clearTimeout(forceExitTimer);
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    });
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { err: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
