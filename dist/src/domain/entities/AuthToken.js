/**
 * Domain Value Object: AuthToken
 * Represents JWT access token with metadata
 */
export class AuthToken {
    token;
    expiresIn;
    userId;
    email;
    role;
    tenantId;
    constructor(token, expiresIn, // seconds
    userId, email, role, tenantId) {
        this.token = token;
        this.expiresIn = expiresIn;
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.tenantId = tenantId;
    }
}
//# sourceMappingURL=AuthToken.js.map