import { Tenant } from '../../domain/entities/Tenant.js';
/**
 * Adapter: Prisma Tenant Repository Implementation
 */
export class PrismaTenantRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            return null;
        return this.toDomain(tenant);
    }
    async create(tenant) {
        const created = await this.prisma.tenant.create({
            data: {
                name: tenant.name,
                status: tenant.status,
            },
        });
        return this.toDomain(created);
    }
    toDomain(prismaTenant) {
        return new Tenant(prismaTenant.id, prismaTenant.name, prismaTenant.status, prismaTenant.createdAt, prismaTenant.deletedAt);
    }
}
//# sourceMappingURL=PrismaTenantRepository.js.map