import type { PrismaClient } from '@prisma/client';
import type { IAuditService } from '../../ports/services/IAuditService.js';
/**
 * Adapter: Prisma Audit Service Implementation
 */
export declare class PrismaAuditService implements IAuditService {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    log(tenantId: string, action: string, entity: string, entityId: string | null, actorUserId: string | null, metadata?: Record<string, unknown>): Promise<void>;
}
//# sourceMappingURL=PrismaAuditService.d.ts.map