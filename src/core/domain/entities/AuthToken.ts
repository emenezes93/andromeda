/**
 * Domain Value Object: AuthToken
 * Represents JWT access token with metadata
 */
export class AuthToken {
  constructor(
    public readonly token: string,
    public readonly expiresIn: number, // seconds
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
    public readonly tenantId: string
  ) {}
}
