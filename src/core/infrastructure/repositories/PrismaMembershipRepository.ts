import type { PrismaClient } from '@prisma/client';
import { User } from '@domain/entities/User.js';
import { Membership } from '@domain/entities/Membership.js';
import type { IMembershipRepository, MemberWithUser } from '@ports/repositories/IMembershipRepository.js';

const VALID_ROLES = ['owner', 'admin', 'practitioner', 'viewer'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function parseRole(role: string): ValidRole {
  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    throw new Error(`Invalid role value from database: "${role}"`);
  }
  return role as ValidRole;
}

/**
 * Adapter: Prisma Membership Repository Implementation
 */
export class PrismaMembershipRepository implements IMembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Membership | null> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { tenant: true },
    });
    if (!membership) return null;
    return this.toDomain(membership);
  }

  async findByUserIdAndTenantId(userId: string, tenantId: string): Promise<Membership | null> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenantId },
      include: { tenant: true, user: true },
    });
    if (!membership) return null;
    return this.toDomain(membership);
  }

  async create(membership: Membership): Promise<Membership> {
    const created = await this.prisma.membership.create({
      data: {
        userId: membership.userId,
        tenantId: membership.tenantId,
        role: membership.role,
        active: membership.active,
      },
    });
    return this.toDomain(created);
  }

  async findAllByTenantId(
    tenantId: string,
    opts: { page: number; limit: number; active?: boolean; role?: string }
  ): Promise<{ data: (MemberWithUser & { lastActivityAt: Date | null })[]; total: number }> {
    const where = {
      tenantId,
      ...(opts.active !== undefined && { active: opts.active }),
      ...(opts.role !== undefined && opts.role !== '' && { role: opts.role }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.membership.count({ where }),
    ]);
    const userIds = rows.map((m) => m.userId);
    const lastActivities =
      userIds.length > 0
        ? await this.prisma.auditLog.groupBy({
            by: ['actorUserId'],
            where: { actorUserId: { in: userIds }, tenantId },
            _max: { createdAt: true },
          })
        : [];
    const activityMap = new Map(
      lastActivities
        .filter((a) => a.actorUserId != null)
        .map((a) => [a.actorUserId!, a._max.createdAt ?? null])
    );
    const data = rows.map((m) => ({
      membership: this.toDomain(m),
      user: this.userToDomain(m.user),
      lastActivityAt: activityMap.get(m.userId) ?? null,
    }));
    return { data, total };
  }

  async updateRole(membershipId: string, role: string): Promise<Membership> {
    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
    });
    return this.toDomain(updated);
  }

  async setActive(membershipId: string, active: boolean): Promise<Membership> {
    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { active },
    });
    return this.toDomain(updated);
  }

  async deleteByUserIdAndTenantId(userId: string, tenantId: string): Promise<void> {
    await this.prisma.membership.deleteMany({
      where: { userId, tenantId },
    });
  }

  private userToDomain(prismaUser: {
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

  private toDomain(prismaMembership: {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    active: boolean;
    createdAt: Date;
  }): Membership {
    return new Membership(
      prismaMembership.id,
      prismaMembership.userId,
      prismaMembership.tenantId,
      parseRole(prismaMembership.role),
      prismaMembership.active,
      prismaMembership.createdAt
    );
  }
}
