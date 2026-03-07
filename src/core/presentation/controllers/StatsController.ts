import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import type { GetDashboardStatsUseCase } from '@application/use-cases/stats/GetDashboardStatsUseCase.js';
import type { GetTemplateReportUseCase } from '@application/use-cases/stats/GetTemplateReportUseCase.js';
import type { GetStudentsOverviewUseCase } from '@application/use-cases/stats/GetStudentsOverviewUseCase.js';
import type { GetAnalyticsDashboardUseCase } from '@application/use-cases/stats/GetAnalyticsDashboardUseCase.js';

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
    private readonly getTemplateReportUseCase: GetTemplateReportUseCase,
    private readonly getStudentsOverviewUseCase: GetStudentsOverviewUseCase,
    private readonly getAnalyticsDashboardUseCase: GetAnalyticsDashboardUseCase
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

    app.get(
      '/v1/stats/students-overview',
      { schema: { response: { 200: { type: 'object' } } } },
      this.studentsOverview.bind(this)
    );

    app.get<{ Querystring: { days?: number } }>(
      '/v1/stats/analytics',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: { days: { type: 'number' } },
          },
        },
      },
      this.analytics.bind(this)
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

  private async studentsOverview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const result = await this.getStudentsOverviewUseCase.execute({ tenantId });
    await reply.status(200).send(result);
  }

  private async analytics(
    request: FastifyRequest<{ Querystring: { days?: number } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const days = request.query.days ?? 30;
    const periodDays = Math.min(365, Math.max(7, days));
    const result = await this.getAnalyticsDashboardUseCase.execute({ tenantId, periodDays });
    await reply.status(200).send(result);
  }
}
