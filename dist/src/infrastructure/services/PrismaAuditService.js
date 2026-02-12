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
                metadataJson: metadata ?? {},
            },
        });
    }
}
//# sourceMappingURL=PrismaAuditService.js.map