import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import type { GetDashboardStatsUseCase } from '@application/use-cases/stats/GetDashboardStatsUseCase.js';
import type { GetTemplateReportUseCase } from '@application/use-cases/stats/GetTemplateReportUseCase.js';

const dashboardQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
  pendingDays: z.coerce.number().int().min(1).max(90).optional(),
  highRiskThreshold: z.coerce.number().int().min(0).max(100).optional(),
});

export class StatsController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private readonly getTemplateReportUseCase: GetTemplateReportUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/v1/stats/dashboard',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              days: { type: 'number' },
              pendingDays: { type: 'number' },
              highRiskThreshold: { type: 'number' },
            },
          },
        },
      },
      this.dashboard.bind(this)
    );

    app.get<{
      Params: { id: string };
      Querystring: { from?: string; to?: string; days?: number };
    }>(
      '/v1/stats/templates/:id',
      {
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          querystring: {
            type: 'object',
            properties: { from: { type: 'string' }, to: { type: 'string' }, days: { type: 'number' } },
          },
        },
      },
      this.templateReport.bind(this)
    );
  }

  private async dashboard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const query = dashboardQuerySchema.parse(request.query);
    const result = await this.getDashboardStatsUseCase.execute({
      tenantId,
      from: query.from,
      to: query.to,
      days: query.days,
      pendingDays: query.pendingDays,
      highRiskThreshold: query.highRiskThreshold,
    });
    await reply.status(200).send(result);
  }

  private async templateReport(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { from?: string; to?: string; days?: number } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const { id: templateId } = request.params;
    const query = dashboardQuerySchema.pick({ from: true, to: true, days: true }).parse(request.query);
    const result = await this.getTemplateReportUseCase.execute({
      tenantId,
      templateId,
      from: query.from,
      to: query.to,
      days: query.days,
    });
    await reply.status(200).send(result);
  }
}
