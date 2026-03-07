import type { PrismaClient } from '@prisma/client';
import { Tenant } from '@domain/entities/Tenant.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

/**
 * Adapter: Prisma Tenant Repository Implementation
 */
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return null;
    return this.toDomain(tenant);
  }

  async findAll(opts: { page: number; limit: number }): Promise<{ data: Tenant[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);
    return { data: rows.map((t) => this.toDomain(t)), total };
  }

  async create(data: { name: string; status?: string; trialEndsAt?: Date }): Promise<Tenant> {
    const created = await this.prisma.tenant.create({
      data: {
        name: data.name,
        status: data.status ?? 'active',
        ...(data.trialEndsAt && { trialEndsAt: data.trialEndsAt }),
      },
    });
    return this.toDomain(created);
  }

  async createWithOwner(data: {
    name: string;
    trialEndsAt: Date;
    ownerEmail: string;
    ownerPasswordHash: string;
    ownerName: string | null;
  }): Promise<{ tenantId: string; userId: string; ownerEmail: string; ownerName: string | null }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          status: 'active',
          planTier: 'free',
          trialEndsAt: data.trialEndsAt,
        },
      });
      const user = await tx.user.create({
        data: {
          email: data.ownerEmail,
          passwordHash: data.ownerPasswordHash,
          name: data.ownerName,
        },
      });
      await tx.membership.create({
        data: { userId: user.id, tenantId: tenant.id, role: 'owner', active: true },
      });
      return { tenantId: tenant.id, userId: user.id, ownerEmail: data.ownerEmail, ownerName: data.ownerName };
    });
    return result;
  }

  async update(
    id: string,
    data: {
      name?: string;
      status?: string;
      emailAlertsEnabled?: boolean;
      logoUrl?: string | null;
      brandColor?: string | null;
    }
  ): Promise<Tenant> {
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.emailAlertsEnabled !== undefined && { emailAlertsEnabled: data.emailAlertsEnabled }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.brandColor !== undefined && { brandColor: data.brandColor }),
      },
    });
    return this.toDomain(updated);
  }

  async suspend(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) throw new NotFoundError('Tenant not found');
    const suspended = tenant.suspend();
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: suspended.status },
    });
    return this.toDomain(updated);
  }

  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) throw new NotFoundError('Tenant not found');
    const activated = tenant.activate();
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: activated.status },
    });
    return this.toDomain(updated);
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { name, deletedAt: null },
    });
    return count > 0;
  }

  private toDomain(prismaTenant: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    deletedAt: Date | null;
    planTier?: string;
    emailAlertsEnabled?: boolean;
    logoUrl?: string | null;
    brandColor?: string | null;
  }): Tenant {
    return new Tenant(
      prismaTenant.id,
      prismaTenant.name,
      prismaTenant.status as Tenant['status'],
      prismaTenant.createdAt,
      prismaTenant.deletedAt,
      prismaTenant.planTier ?? 'free',
      prismaTenant.emailAlertsEnabled ?? false,
      prismaTenant.logoUrl ?? null,
      prismaTenant.brandColor ?? null
    );
  }
}
