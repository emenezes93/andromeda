/**
 * Domain Value Object: AuthToken
 * Represents JWT access token with metadata
 */
export declare class AuthToken {
    readonly token: string;
    readonly expiresIn: number;
    readonly userId: string;
    readonly email: string;
    readonly role: string;
    readonly tenantId: string;
    constructor(token: string, expiresIn: number, // seconds
    userId: string, email: string, role: string, tenantId: string);
}
//# sourceMappingURL=AuthToken.d.ts.map