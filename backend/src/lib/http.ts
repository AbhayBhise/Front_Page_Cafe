import type { NextFunction, Request, Response } from 'express';

/** Wrap async route handlers so thrown errors reach the error middleware. */
export const asyncHandler =
  <T = unknown>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data });
}

export function paginated(
  res: Response,
  items: unknown[],
  meta: { total: number; page: number; pageSize: number },
) {
  return res.json({ data: items, meta: { ...meta, pages: Math.ceil(meta.total / meta.pageSize) || 1 } });
}
