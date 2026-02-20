import type { PrismaClient } from '@prisma/client';
import type {
  IAuditQueryRepository,
  AuditListOpts,
  AuditListResult,
  AuditLogEntry,
} from '@ports/repositories/IAuditQueryRepository.js';

export class PrismaAuditQueryRepository implements IAuditQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(tenantId: string, opts: AuditListOpts): Promise<AuditListResult> {
    const where: Record<string, unknown> = { tenantId };
    if (opts.action) where.action = opts.action;
    if (opts.entity) where.entity = opts.entity;
    if (opts.entityId) where.entityId = opts.entityId;
    if (opts.userId) where.actorUserId = opts.userId;
    if (opts.from || opts.to) {
      where.createdAt = {};
      if (opts.from) (where.createdAt as Record<string, Date>).gte = new Date(opts.from);
      if (opts.to) (where.createdAt as Record<string, Date>).lte = new Date(opts.to);
    }
    const skip = (opts.page - 1) * opts.limit;
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: opts.limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);
    const data: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      actorUserId: r.actorUserId,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadataJson: r.metadataJson ? (r.metadataJson as Record<string, unknown>) : null,
      createdAt: r.createdAt,
    }));
    return { data, total };
  }
}
