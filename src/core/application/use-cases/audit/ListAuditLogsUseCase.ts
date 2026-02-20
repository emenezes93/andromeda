import type { IAuditQueryRepository } from '@ports/repositories/IAuditQueryRepository.js';

export interface ListAuditLogsRequest {
  tenantId: string;
  page: number;
  limit: number;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export interface ListAuditLogsResponse {
  data: Array<{
    id: string;
    tenantId: string;
    actorUserId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    metadataJson: Record<string, unknown> | null;
    createdAt: Date;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

export class ListAuditLogsUseCase {
  constructor(private readonly auditQueryRepository: IAuditQueryRepository) {}

  async execute(request: ListAuditLogsRequest): Promise<ListAuditLogsResponse> {
    const { data, total } = await this.auditQueryRepository.list(request.tenantId, {
      page: request.page,
      limit: request.limit,
      action: request.action,
      entity: request.entity,
      entityId: request.entityId,
      userId: request.userId,
      from: request.from,
      to: request.to,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data,
      meta: {
        page: request.page,
        limit: request.limit,
        total,
        totalPages,
        hasMore: request.page * request.limit < total,
      },
    };
  }
}
