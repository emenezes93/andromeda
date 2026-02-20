import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { paginationQuerySchema } from '@shared/utils/pagination.js';
import type { ListTemplatesUseCase } from '@application/use-cases/anamnesis/templates/ListTemplatesUseCase.js';
import type { GetTemplateUseCase } from '@application/use-cases/anamnesis/templates/GetTemplateUseCase.js';
import type { CreateTemplateUseCase } from '@application/use-cases/anamnesis/templates/CreateTemplateUseCase.js';
import type { UpdateTemplateUseCase } from '@application/use-cases/anamnesis/templates/UpdateTemplateUseCase.js';
import type { DeleteTemplateUseCase } from '@application/use-cases/anamnesis/templates/DeleteTemplateUseCase.js';
import { createTemplateSchema, updateTemplateSchema } from '../../../schemas/templates.js';
import { env } from '@config/env.js';

const rateLimitConfig = {
  max: Number(env.RATE_LIMIT_TEMPLATES) || 30,
  timeWindow: '1 minute' as const,
};

export class TemplateController {
  constructor(
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    private readonly getTemplateUseCase: GetTemplateUseCase,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/v1/anamnesis/templates',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          querystring: { type: 'object', properties: { page: {}, limit: {} } },
          response: { 200: { $ref: 'TemplateListResponse#' } },
        },
      },
      this.list.bind(this)
    );
    app.get(
      '/v1/anamnesis/templates/:id',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          response: { 200: { $ref: 'TemplateResponse#' } },
        },
      },
      this.get.bind(this)
    );
    app.post(
      '/v1/anamnesis/templates',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          body: { $ref: 'CreateTemplateBody#' },
          response: { 201: { $ref: 'TemplateResponse#' } },
        },
      },
      this.create.bind(this)
    );
    app.patch(
      '/v1/anamnesis/templates/:id',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        },
      },
      this.update.bind(this)
    );
    app.delete(
      '/v1/anamnesis/templates/:id',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        },
      },
      this.delete.bind(this)
    );
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const { page, limit } = paginationQuerySchema.parse(request.query);
    const result = await this.listTemplatesUseCase.execute({ tenantId, page, limit });
    await reply.status(200).send(result);
  }

  private async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const { id } = request.params as { id: string };
    const result = await this.getTemplateUseCase.execute({ templateId: id, tenantId });
    await reply.status(200).send(result);
  }

  private async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.templates(user.role);
    const body = createTemplateSchema.parse(request.body);
    const result = await this.createTemplateUseCase.execute({
      tenantId,
      name: body.name,
      schemaJson: body.schemaJson,
    });
    await reply.status(201).send(result);
  }

  private async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.templates(user.role);
    const { id } = request.params as { id: string };
    const body = updateTemplateSchema.parse(request.body);
    const result = await this.updateTemplateUseCase.execute({
      templateId: id,
      tenantId,
      name: body.name,
      schemaJson: body.schemaJson,
    });
    await reply.status(200).send(result);
  }

  private async delete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.templates(user.role);
    const { id } = request.params as { id: string };
    await this.deleteTemplateUseCase.execute({ templateId: id, tenantId });
    await reply.status(204).send();
  }
}
