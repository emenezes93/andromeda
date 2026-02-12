/**
 * Adapter: Prisma Audit Service Implementation
 */
export class PrismaAuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(tenantId, action, entity, entityId, actorUserId, metadata) {
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                actorUserId,
                action,
                entity,
                entityId,
                // Cast avoids depending on Prisma.InputJsonValue from generated client (Docker)
                metadataJson: (metadata ?? {}),
            },
        });
    }
}
//# sourceMappingURL=PrismaAuditService.js.map