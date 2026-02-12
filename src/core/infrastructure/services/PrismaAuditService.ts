import type { PrismaClient } from '@prisma/client';
import type { IAuditService } from '@ports/services/IAuditService.js';

/**
 * Adapter: Prisma Audit Service Implementation
 */
export class PrismaAuditService implements IAuditService {
  constructor(private readonly prisma: PrismaClient) {}

  async log(
    tenantId: string,
    action: string,
    entity: string,
    entityId: string | null,
    actorUserId: string | null,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId,
        action,
        entity,
        entityId,
        // Cast avoids depending on Prisma.InputJsonValue from generated client (Docker)
        metadataJson: (metadata ?? {}) as object,
      },
    });
  }
}
