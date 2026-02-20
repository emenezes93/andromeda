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

  async findAll(
    tenantId: string,
    opts: { page: number; limit: number; active?: boolean }
  ): Promise<{ data: User[]; total: number }> {
    const where = { tenantId, ...(opts.active !== undefined && { active: opts.active }) };
    const [memberships, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.membership.count({ where }),
    ]);
    const users = memberships
      .map((m) => m.user)
      .filter((u) => u.deletedAt == null)
      .map((u) => this.toDomain(u));
    return { data: users, total };
  }

  async findByIdInTenant(id: string, tenantId: string): Promise<User | null> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: id, tenantId },
      include: { user: true },
    });
    if (!membership?.user || membership.user.deletedAt) return null;
    return this.toDomain(membership.user);
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

  async createWithMembership(data: {
    email: string;
    passwordHash: string;
    name: string | null;
    tenantId: string;
    role: string;
  }): Promise<User> {
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
        },
      });
      await tx.membership.create({
        data: { userId: user.id, tenantId: data.tenantId, role: data.role, active: true },
      });
      return user;
    });
    return this.toDomain(created);
  }

  async update(
    id: string,
    _tenantId: string,
    data: { name?: string; email?: string; passwordHash?: string }
  ): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
      },
    });
    return this.toDomain(updated);
  }

  async softDelete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MINUTES = 15;

  async recordFailedLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const attempts = (user.loginAttempts ?? 0) + 1;
    const lockedUntil =
      attempts >= PrismaUserRepository.MAX_ATTEMPTS
        ? new Date(Date.now() + PrismaUserRepository.LOCK_DURATION_MINUTES * 60 * 1000)
        : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: attempts, lockedUntil },
    });
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lockedUntil: null },
    });
  }

  private toDomain(prismaUser: {
    id: string;
    email: string;
    passwordHash: string;
    name: string | null;
    createdAt: Date;
    deletedAt: Date | null;
    loginAttempts?: number;
    lockedUntil?: Date | null;
  }): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.passwordHash,
      prismaUser.name,
      prismaUser.createdAt,
      prismaUser.deletedAt,
      prismaUser.loginAttempts ?? 0,
      prismaUser.lockedUntil ?? null
    );
  }
}
