export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (m = 'Bad request', d?: unknown) => new AppError(400, m, 'bad_request', d);
export const Unauthorized = (m = 'Authentication required') => new AppError(401, m, 'unauthorized');
export const Forbidden = (m = 'You do not have permission to do that') => new AppError(403, m, 'forbidden');
export const NotFound = (m = 'Resource not found') => new AppError(404, m, 'not_found');
export const Conflict = (m = 'Conflict', d?: unknown) => new AppError(409, m, 'conflict', d);
export const Unprocessable = (m = 'Validation failed', d?: unknown) => new AppError(422, m, 'validation_error', d);
