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
    public readonly deletedAt: Date | null = null
  ) {}

  static create(email: string, passwordHash: string, name: string | null = null): User {
    return new User('', email, passwordHash, name, new Date(), null);
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
