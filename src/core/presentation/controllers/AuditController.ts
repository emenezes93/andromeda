import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { paginationQuerySchema } from '@shared/utils/pagination.js';
import type { ListAuditLogsUseCase } from '@application/use-cases/audit/ListAuditLogsUseCase.js';

const auditQuerySchema = paginationQuerySchema.extend({
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export class AuditController {
  constructor(private readonly listAuditLogsUseCase: ListAuditLogsUseCase) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/v1/audit',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              action: { type: 'string' },
              entity: { type: 'string' },
              entityId: { type: 'string' },
              userId: { type: 'string' },
              from: { type: 'string' },
              to: { type: 'string' },
            },
          },
          response: { 200: { $ref: 'AuditListResponse#' } },
        },
      },
      this.list.bind(this)
    );
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.audit(request.user!.role);

    const q = auditQuerySchema.parse(request.query);
    const result = await this.listAuditLogsUseCase.execute({
      tenantId,
      page: q.page,
      limit: q.limit,
      action: q.action,
      entity: q.entity,
      entityId: q.entityId,
      userId: q.userId,
      from: q.from,
      to: q.to,
    });
    await reply.status(200).send(result);
  }
}
