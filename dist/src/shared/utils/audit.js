export async function auditLog(prisma, tenantId, action, entity, entityId, actorUserId, metadata) {
    await prisma.auditLog.create({
        data: {
            tenantId,
            actorUserId,
            action,
            entity,
            entityId,
            // Cast avoids depending on Prisma.InputJsonValue from generated client (Docker)
            metadataJson: (metadata ?? undefined),
        },
    });
}
//# sourceMappingURL=audit.js.map