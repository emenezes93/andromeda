/**
 * Domain Entity: RefreshToken
 */
export declare class RefreshToken {
    readonly id: string;
    readonly userId: string;
    readonly tenantId: string;
    readonly token: string;
    readonly expiresAt: Date;
    readonly revokedAt: Date | null;
    readonly createdAt: Date;
    constructor(id: string, userId: string, tenantId: string, token: string, expiresAt: Date, revokedAt: Date | null, createdAt: Date);
    static create(userId: string, tenantId: string, token: string, expiresAt: Date): RefreshToken;
    isExpired(): boolean;
    isRevoked(): boolean;
    isValid(): boolean;
    revoke(): RefreshToken;
}
//# sourceMappingURL=RefreshToken.d.ts.map