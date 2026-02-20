import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { requireRole } from '@shared/utils/rbac.js';
import { Guards } from '@shared/utils/rbac.js';
import { paginationQuerySchema } from '@shared/utils/pagination.js';
import type { ListTenantsUseCase } from '@application/use-cases/tenants/ListTenantsUseCase.js';
import type { GetTenantUseCase } from '@application/use-cases/tenants/GetTenantUseCase.js';
import type { CreateTenantUseCase } from '@application/use-cases/tenants/CreateTenantUseCase.js';
import type { UpdateTenantUseCase } from '@application/use-cases/tenants/UpdateTenantUseCase.js';
import type { SuspendTenantUseCase } from '@application/use-cases/tenants/SuspendTenantUseCase.js';
import type { ActivateTenantUseCase } from '@application/use-cases/tenants/ActivateTenantUseCase.js';

const createTenantBodySchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'suspended']).optional().default('active'),
});

const updateTenantBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

export class TenantController {
  constructor(
    private readonly listTenantsUseCase: ListTenantsUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
    private readonly suspendTenantUseCase: SuspendTenantUseCase,
    private readonly activateTenantUseCase: ActivateTenantUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get(
      '/v1/tenants',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
            },
          },
          response: { 200: { $ref: 'TenantListResponse#' } },
        },
      },
      this.list.bind(this)
    );
    app.post(
      '/v1/tenants',
      {
        schema: {
          body: { $ref: 'CreateTenantBody#' },
          response: { 201: { $ref: 'TenantResponse#' } },
        },
      },
      this.create.bind(this)
    );
    app.get(
      '/v1/tenants/:id',
      {
        schema: {
          params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string' } },
            additionalProperties: false,
          },
          response: { 200: { $ref: 'TenantResponse#' } },
        },
      },
      this.get.bind(this)
    );
    app.patch(
      '/v1/tenants/:id',
      {
        schema: {
          params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string' } },
            additionalProperties: false,
          },
          body: { $ref: 'UpdateTenantBody#' },
          response: { 200: { $ref: 'TenantResponse#' } },
        },
      },
      this.update.bind(this)
    );
    app.post(
      '/v1/tenants/:id/suspend',
      {
        schema: {
          params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string' } },
            additionalProperties: false,
          },
          response: { 200: { $ref: 'TenantResponse#' } },
        },
      },
      this.suspend.bind(this)
    );
    app.post(
      '/v1/tenants/:id/activate',
      {
        schema: {
          params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string' } },
            additionalProperties: false,
          },
          response: { 200: { $ref: 'TenantResponse#' } },
        },
      },
      this.activate.bind(this)
    );
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'owner');
    const query = request.query as { page?: number; limit?: number };
    const { page, limit } = paginationQuerySchema.parse({
      page: query.page,
      limit: query.limit,
    });
    const result = await this.listTenantsUseCase.execute({ page, limit });
    await reply.status(200).send(result);
  }

  private async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'owner');
    const body = createTenantBodySchema.parse(request.body);
    const result = await this.createTenantUseCase.execute({
      name: body.name,
      status: body.status,
      actorUserId: user.userId,
      actorTenantId: user.tenantId,
    });
    await reply.status(201).send(result);
  }

  private async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const { id } = request.params as { id: string };
    const result = await this.getTenantUseCase.execute({ tenantId: id });
    await reply.status(200).send(result);
  }

  private async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'owner');
    const { id } = request.params as { id: string };
    const body = updateTenantBodySchema.parse(request.body);
    const result = await this.updateTenantUseCase.execute({
      tenantId: id,
      actorUserId: user.userId,
      actorTenantId: user.tenantId,
      name: body.name,
      status: body.status,
    });
    await reply.status(200).send(result);
  }

  private async suspend(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'owner');
    const { id } = request.params as { id: string };
    const result = await this.suspendTenantUseCase.execute({
      tenantId: id,
      actorUserId: user.userId,
      actorTenantId: user.tenantId,
    });
    await reply.status(200).send(result);
  }

  private async activate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'owner');
    const { id } = request.params as { id: string };
    const result = await this.activateTenantUseCase.execute({
      tenantId: id,
      actorUserId: user.userId,
      actorTenantId: user.tenantId,
    });
    await reply.status(200).send(result);
  }
}
