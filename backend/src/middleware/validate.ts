import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { Unprocessable } from '../lib/errors';

type Part = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: Part = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      // query/params are read-only getters in Express 5; assign safely
      Object.defineProperty(req, part, { value: parsed, writable: true, configurable: true });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          Unprocessable(
            'Validation failed',
            err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          ),
        );
      } else {
        next(err);
      }
    }
  };
}
