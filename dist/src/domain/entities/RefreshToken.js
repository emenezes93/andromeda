/**
 * Domain Entity: RefreshToken
 */
export class RefreshToken {
    id;
    userId;
    tenantId;
    token;
    expiresAt;
    revokedAt;
    createdAt;
    constructor(id, userId, tenantId, token, expiresAt, revokedAt, createdAt) {
        this.id = id;
        this.userId = userId;
        this.tenantId = tenantId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.revokedAt = revokedAt;
        this.createdAt = createdAt;
    }
    static create(userId, tenantId, token, expiresAt) {
        return new RefreshToken('', userId, tenantId, token, expiresAt, null, new Date());
    }
    isExpired() {
        return this.expiresAt < new Date();
    }
    isRevoked() {
        return this.revokedAt !== null;
    }
    isValid() {
        return !this.isExpired() && !this.isRevoked();
    }
    revoke() {
        return new RefreshToken(this.id, this.userId, this.tenantId, this.token, this.expiresAt, new Date(), this.createdAt);
    }
}
//# sourceMappingURL=RefreshToken.js.map