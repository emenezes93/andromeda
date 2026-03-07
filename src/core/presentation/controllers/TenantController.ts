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
  emailAlertsEnabled: z.boolean().optional(),
  logoUrl: z.string().url().optional().nullable(),
  brandColor: z.string().max(50).optional().nullable(),
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
      '/v1/tenants/:id/logo',
      {
        schema: {
          params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string' } },
            additionalProperties: false,
          },
          response: { 200: { type: 'object', properties: { logoUrl: { type: 'string' } } } },
        },
      },
      this.uploadLogo.bind(this)
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
      emailAlertsEnabled: body.emailAlertsEnabled,
      logoUrl: body.logoUrl,
      brandColor: body.brandColor,
    });
    await reply.status(200).send(result);
  }

  private async uploadLogo(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'admin');
    const { id } = request.params as { id: string };
    if (id !== tenantId) {
      await reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const data = await request.file();
    if (!data) {
      await reply.status(400).send({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(data.mimetype)) {
      await reply.status(400).send({
        error: 'Formato inválido. Use PNG, JPEG, WebP ou SVG.',
      });
      return;
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 2 * 1024 * 1024) {
      await reply.status(400).send({ error: 'Arquivo excede 2MB' });
      return;
    }

    const ext = data.mimetype.split('/')[1] === 'svg+xml' ? 'svg' : data.mimetype.split('/')[1];
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const storagePath = process.env.UPLOAD_STORAGE_PATH || './uploads';
    const dir = path.join(storagePath, 'logos', tenantId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `logo.${ext}`);
    await fs.writeFile(filePath, buffer);

    const logoUrl = `/uploads/logos/${tenantId}/logo.${ext}`;
    await this.updateTenantUseCase.execute({
      tenantId: id,
      actorUserId: user.userId,
      actorTenantId: tenantId,
      logoUrl,
    });

    await reply.status(200).send({ logoUrl });
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
