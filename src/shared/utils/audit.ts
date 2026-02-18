import type { PrismaClient } from '@prisma/client';

export async function auditLog(
  prisma: PrismaClient,
  tenantId: string,
  action: string,
  entity: string,
  entityId: string | null,
  actorUserId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorUserId,
      action,
      entity,
      entityId,
      // Cast avoids depending on Prisma.InputJsonValue from generated client (Docker)
      metadataJson: (metadata ?? undefined) as object | undefined,
    },
  });
}
