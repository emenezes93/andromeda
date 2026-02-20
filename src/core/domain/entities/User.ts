/**
 * Domain Entity: User
 * Pure business logic, no infrastructure dependencies
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly name: string | null,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null = null,
    public readonly loginAttempts: number = 0,
    public readonly lockedUntil: Date | null = null
  ) {}

  static create(email: string, passwordHash: string, name: string | null = null): User {
    return new User('', email, passwordHash, name, new Date(), null, 0, null);
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date();
  }
}
