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

  async create(data: { name: string; status?: string }): Promise<Tenant> {
    const created = await this.prisma.tenant.create({
      data: {
        name: data.name,
        status: data.status ?? 'active',
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, data: { name?: string; status?: string }): Promise<Tenant> {
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
    return this.toDomain(updated);
  }

  async suspend(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) throw new Error('Tenant not found');
    const suspended = tenant.suspend();
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: suspended.status },
    });
    return this.toDomain(updated);
  }

  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) throw new Error('Tenant not found');
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
