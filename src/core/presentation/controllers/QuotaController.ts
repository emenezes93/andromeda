import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import type { IQuotaService } from '@ports/services/IQuotaService.js';

export class QuotaController {
  constructor(private readonly quotaService: IQuotaService) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/v1/quota/usage',
      { schema: {} },
      this.getUsage.bind(this)
    );
  }

  private async getUsage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const summary = await this.quotaService.getUsageSummary(tenantId);
    await reply.status(200).send(summary);
  }
}
