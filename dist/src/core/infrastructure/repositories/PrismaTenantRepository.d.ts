import type { PrismaClient } from '@prisma/client';
import { Tenant } from '../../domain/entities/Tenant.js';
import type { ITenantRepository } from '../../ports/repositories/ITenantRepository.js';
/**
 * Adapter: Prisma Tenant Repository Implementation
 */
export declare class PrismaTenantRepository implements ITenantRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<Tenant | null>;
    create(tenant: Tenant): Promise<Tenant>;
    private toDomain;
}
//# sourceMappingURL=PrismaTenantRepository.d.ts.map