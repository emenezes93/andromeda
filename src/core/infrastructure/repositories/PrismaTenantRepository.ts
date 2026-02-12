import type { PrismaClient } from '@prisma/client';
import { Tenant } from '@domain/entities/Tenant.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';

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

  async create(tenant: Tenant): Promise<Tenant> {
    const created = await this.prisma.tenant.create({
      data: {
        name: tenant.name,
        status: tenant.status,
      },
    });
    return this.toDomain(created);
  }

  private toDomain(prismaTenant: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    deletedAt: Date | null;
  }): Tenant {
    return new Tenant(
      prismaTenant.id,
      prismaTenant.name,
      prismaTenant.status as Tenant['status'],
      prismaTenant.createdAt,
      prismaTenant.deletedAt
    );
  }
}
