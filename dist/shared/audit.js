export async function auditLog(prisma, tenantId, action, entity, entityId, actorUserId, metadata) {
    await prisma.auditLog.create({
        data: {
            tenantId,
            actorUserId,
            action,
            entity,
            entityId,
            metadataJson: metadata ?? undefined,
        },
    });
}
//# sourceMappingURL=audit.js.map