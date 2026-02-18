/**
 * Application Error Hierarchy
 * Base error class and specific error types
 */

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Unprocessable entity') {
    super(message, 422, 'UNPROCESSABLE_ENTITY');
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function statusFromError(err: unknown): number {
  if (isAppError(err)) return err.statusCode;
  if (err instanceof Error && 'statusCode' in err)
    return (err as { statusCode: number }).statusCode;
  return 500;
}

export function messageFromError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}
