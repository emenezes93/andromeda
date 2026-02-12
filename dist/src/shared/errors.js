/**
 * Application errors with HTTP status codes
 */
export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export class BadRequestError extends AppError {
    constructor(message = 'Bad request', code) {
        super(message, 400, code ?? 'BAD_REQUEST');
        this.name = 'BadRequestError';
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code) {
        super(message, 401, code ?? 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code) {
        super(message, 403, code ?? 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Not found', code) {
        super(message, 404, code ?? 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
export class ConflictError extends AppError {
    constructor(message = 'Conflict', code) {
        super(message, 409, code ?? 'CONFLICT');
        this.name = 'ConflictError';
    }
}
export class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable entity', code) {
        super(message, 422, code ?? 'UNPROCESSABLE_ENTITY');
        this.name = 'UnprocessableEntityError';
    }
}
export function isAppError(err) {
    return err instanceof AppError;
}
export function statusFromError(err) {
    if (isAppError(err))
        return err.statusCode;
    return 500;
}
export function messageFromError(err) {
    if (err instanceof Error)
        return err.message;
    return 'Internal server error';
}
//# sourceMappingURL=errors.js.map