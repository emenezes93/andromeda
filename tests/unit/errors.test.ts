import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  isAppError,
  statusFromError,
  messageFromError,
} from '@shared/errors/AppError.js';

describe('AppError', () => {
  it('stores message, statusCode and code', () => {
    const err = new AppError('test message', 500, 'TEST_CODE');
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('TEST_CODE');
  });

  it('sets name to constructor name', () => {
    const err = new AppError('msg', 500, 'X');
    expect(err.name).toBe('AppError');
  });

  it('is an instance of Error', () => {
    expect(new AppError('m', 500, 'X')).toBeInstanceOf(Error);
  });

  it('has a stack trace', () => {
    const err = new AppError('m', 500, 'X');
    expect(err.stack).toBeDefined();
  });
});

describe('BadRequestError', () => {
  it('has statusCode 400 and code BAD_REQUEST', () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  it('uses default message "Bad request"', () => {
    expect(new BadRequestError().message).toBe('Bad request');
  });

  it('accepts a custom message', () => {
    expect(new BadRequestError('custom msg').message).toBe('custom msg');
  });

  it('is an instance of AppError', () => {
    expect(new BadRequestError()).toBeInstanceOf(AppError);
  });

  it('name is BadRequestError', () => {
    expect(new BadRequestError().name).toBe('BadRequestError');
  });
});

describe('UnauthorizedError', () => {
  it('has statusCode 401 and code UNAUTHORIZED', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('uses default message "Unauthorized"', () => {
    expect(new UnauthorizedError().message).toBe('Unauthorized');
  });

  it('accepts a custom message', () => {
    expect(new UnauthorizedError('not logged in').message).toBe('not logged in');
  });
});

describe('ForbiddenError', () => {
  it('has statusCode 403 and code FORBIDDEN', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('uses default message "Forbidden"', () => {
    expect(new ForbiddenError().message).toBe('Forbidden');
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 and code NOT_FOUND', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('uses default message "Not found"', () => {
    expect(new NotFoundError().message).toBe('Not found');
  });

  it('accepts a custom message', () => {
    expect(new NotFoundError('User not found').message).toBe('User not found');
  });
});

describe('ConflictError', () => {
  it('has statusCode 409 and code CONFLICT', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('uses default message "Conflict"', () => {
    expect(new ConflictError().message).toBe('Conflict');
  });
});

describe('UnprocessableEntityError', () => {
  it('has statusCode 422 and code UNPROCESSABLE_ENTITY', () => {
    const err = new UnprocessableEntityError();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('UNPROCESSABLE_ENTITY');
  });

  it('uses default message "Unprocessable entity"', () => {
    expect(new UnprocessableEntityError().message).toBe('Unprocessable entity');
  });
});

describe('isAppError()', () => {
  it('returns true for AppError and subclasses', () => {
    expect(isAppError(new AppError('m', 500, 'X'))).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new UnauthorizedError())).toBe(true);
    expect(isAppError(new ForbiddenError())).toBe(true);
    expect(isAppError(new BadRequestError())).toBe(true);
    expect(isAppError(new ConflictError())).toBe(true);
    expect(isAppError(new UnprocessableEntityError())).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(42)).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe('statusFromError()', () => {
  it('returns statusCode from AppError subclasses', () => {
    expect(statusFromError(new NotFoundError())).toBe(404);
    expect(statusFromError(new UnauthorizedError())).toBe(401);
    expect(statusFromError(new ForbiddenError())).toBe(403);
    expect(statusFromError(new BadRequestError())).toBe(400);
    expect(statusFromError(new ConflictError())).toBe(409);
    expect(statusFromError(new UnprocessableEntityError())).toBe(422);
  });

  it('returns statusCode from a plain Error that has statusCode property', () => {
    const err = Object.assign(new Error('x'), { statusCode: 503 });
    expect(statusFromError(err)).toBe(503);
  });

  it('returns 500 for plain Error without statusCode', () => {
    expect(statusFromError(new Error('plain'))).toBe(500);
  });

  it('returns 500 for non-Error values', () => {
    expect(statusFromError('string')).toBe(500);
    expect(statusFromError(null)).toBe(500);
    expect(statusFromError(undefined)).toBe(500);
  });
});

describe('messageFromError()', () => {
  it('returns message from Error', () => {
    expect(messageFromError(new Error('test message'))).toBe('test message');
  });

  it('returns message from AppError', () => {
    expect(messageFromError(new NotFoundError('Patient not found'))).toBe('Patient not found');
  });

  it('returns "Unknown error" for non-Error values', () => {
    expect(messageFromError('string')).toBe('Unknown error');
    expect(messageFromError(42)).toBe('Unknown error');
    expect(messageFromError(null)).toBe('Unknown error');
    expect(messageFromError(undefined)).toBe('Unknown error');
    expect(messageFromError({ message: 'not an error' })).toBe('Unknown error');
  });
});
