import type { PrismaClient } from '@prisma/client';
import { Membership } from '@domain/entities/Membership.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';

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
      },
    });
    return this.toDomain(created);
  }

  private toDomain(prismaMembership: {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    createdAt: Date;
  }): Membership {
    return new Membership(
      prismaMembership.id,
      prismaMembership.userId,
      prismaMembership.tenantId,
      prismaMembership.role as Membership['role'],
      prismaMembership.createdAt
    );
  }
}
