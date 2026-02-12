/**
 * Application Error Hierarchy
 * Base error class and specific error types
 */
export declare class AppError extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly code: string;
    constructor(message: string, statusCode: number, code: string);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class UnprocessableEntityError extends AppError {
    constructor(message?: string);
}
export declare function isAppError(err: unknown): err is AppError;
export declare function statusFromError(err: unknown): number;
export declare function messageFromError(err: unknown): string;
//# sourceMappingURL=AppError.d.ts.map