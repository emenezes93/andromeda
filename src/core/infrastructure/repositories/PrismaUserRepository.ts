import type { PrismaClient } from '@prisma/client';
import { User } from '@domain/entities/User.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';

/**
 * Adapter: Prisma User Repository Implementation
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return this.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return this.toDomain(user);
  }

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
      },
    });
    return this.toDomain(created);
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  private toDomain(prismaUser: {
    id: string;
    email: string;
    passwordHash: string;
    name: string | null;
    createdAt: Date;
    deletedAt: Date | null;
  }): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.passwordHash,
      prismaUser.name,
      prismaUser.createdAt,
      prismaUser.deletedAt
    );
  }
}
