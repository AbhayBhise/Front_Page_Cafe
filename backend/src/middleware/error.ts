import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: { code: 'conflict', message: 'A record with those details already exists' },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: { code: 'not_found', message: 'Record not found' } });
    }
  }

  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    err: err instanceof Error ? err.stack : String(err),
  });

  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
}
