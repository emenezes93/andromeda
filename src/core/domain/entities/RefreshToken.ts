/**
 * Domain Entity: RefreshToken
 */
export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date
  ) {}

  static create(userId: string, tenantId: string, token: string, expiresAt: Date): RefreshToken {
    return new RefreshToken('', userId, tenantId, token, expiresAt, null, new Date());
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(): RefreshToken {
    return new RefreshToken(
      this.id,
      this.userId,
      this.tenantId,
      this.token,
      this.expiresAt,
      new Date(),
      this.createdAt
    );
  }
}
