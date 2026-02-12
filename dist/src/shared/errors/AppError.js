/**
 * Application Error Hierarchy
 * Base error class and specific error types
 */
export class AppError extends Error {
    message;
    statusCode;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409, 'CONFLICT');
    }
}
export class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable entity') {
        super(message, 422, 'UNPROCESSABLE_ENTITY');
    }
}
export function isAppError(err) {
    return err instanceof AppError;
}
export function statusFromError(err) {
    if (isAppError(err))
        return err.statusCode;
    if (err instanceof Error && 'statusCode' in err)
        return err.statusCode;
    return 500;
}
export function messageFromError(err) {
    if (err instanceof Error)
        return err.message;
    return 'Unknown error';
}
//# sourceMappingURL=AppError.js.map