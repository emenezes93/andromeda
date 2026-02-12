import type { PrismaClient } from '@prisma/client';
export declare function auditLog(prisma: PrismaClient, tenantId: string, action: string, entity: string, entityId: string | null, actorUserId: string | null, metadata?: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=audit.d.ts.map