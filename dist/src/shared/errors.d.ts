/**
 * Application errors with HTTP status codes
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class UnprocessableEntityError extends AppError {
    constructor(message?: string, code?: string);
}
export declare function isAppError(err: unknown): err is AppError;
export declare function statusFromError(err: unknown): number;
export declare function messageFromError(err: unknown): string;
//# sourceMappingURL=errors.d.ts.map