import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { paginationQuerySchema } from '@shared/utils/pagination.js';
import type { ListUsersUseCase } from '@application/use-cases/users/ListUsersUseCase.js';
import type { GetUserUseCase } from '@application/use-cases/users/GetUserUseCase.js';
import type { CreateUserUseCase } from '@application/use-cases/users/CreateUserUseCase.js';
import type { DeleteUserUseCase } from '@application/use-cases/users/DeleteUserUseCase.js';
import type { UpdateRoleUseCase } from '@application/use-cases/users/UpdateRoleUseCase.js';
import type { SetActiveUseCase } from '@application/use-cases/users/SetActiveUseCase.js';
import type { ExportUserDataUseCase } from '@application/use-cases/users/ExportUserDataUseCase.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import { ForbiddenError } from '@shared/errors/index.js';

const createUserBodySchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos 1 caractere especial'),
  name: z.string().optional(),
  role: z.enum(['admin', 'practitioner', 'viewer']).default('practitioner'),
});

const updateRoleBodySchema = z.object({
  role: z.enum(['admin', 'practitioner', 'viewer']),
});

function isTenantAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

function canExportUser(
  requestUserId: string,
  requestRole: string,
  targetUserId: string,
  targetInTenant: boolean
): boolean {
  if (requestUserId === targetUserId) return true;
  if (!isTenantAdmin(requestRole)) return false;
  return targetInTenant;
}

export class UserController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly setActiveUseCase: SetActiveUseCase,
    private readonly exportUserDataUseCase: ExportUserDataUseCase,
    private readonly membershipRepository: IMembershipRepository
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/v1/users',
      { schema: { body: { $ref: 'CreateUserBody#' }, response: { 201: { $ref: 'UserResponse#' } } } },
      this.create.bind(this)
    );
    app.get('/v1/users', { schema: {} }, this.list.bind(this));
    app.get(
      '/v1/users/:id',
      { schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, response: { 200: { $ref: 'UserResponse#' } } } },
      this.get.bind(this)
    );
    app.get(
      '/v1/users/:id/export',
      {
        schema: {
          params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
          response: {
            200: {
              type: 'object',
              properties: {
                exportedAt: { type: 'string', format: 'date-time' },
                user: { type: 'object' },
                memberships: { type: 'array' },
                auditLogs: { type: 'array' },
                refreshTokensSummary: { type: 'object' },
              },
            },
          },
        },
      },
      this.export.bind(this)
    );
    app.patch(
      '/v1/users/:id/role',
      { schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
      this.updateRole.bind(this)
    );
    app.delete(
      '/v1/users/:id',
      { schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
      this.delete.bind(this)
    );
    app.patch(
      '/v1/users/:id/activate',
      { schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, response: { 200: { $ref: 'UserResponse#' } } } },
      this.activate.bind(this)
    );
    app.patch(
      '/v1/users/:id/deactivate',
      { schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, response: { 200: { $ref: 'UserResponse#' } } } },
      this.deactivate.bind(this)
    );
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const query = request.query as { page?: number; limit?: number; active?: string };
    const { page, limit } = paginationQuerySchema.parse({
      page: query.page,
      limit: query.limit,
    });
    const active = query.active === undefined ? undefined : query.active === 'true';
    const result = await this.listUsersUseCase.execute({
      tenantId,
      page,
      limit,
      active,
    });
    await reply.status(200).send(result);
  }

  private async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const { id } = request.params as { id: string };
    const result = await this.getUserUseCase.execute({ userId: id, tenantId });
    await reply.status(200).send(result);
  }

  private async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const body = createUserBodySchema.parse(request.body);
    const result = await this.createUserUseCase.execute({
      tenantId,
      actorUserId: user.userId,
      email: body.email,
      password: body.password,
      name: body.name ?? null,
      role: body.role,
    });
    await reply.status(201).send({ id: result.id, email: result.email, name: result.name });
  }

  private async export(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    const { id: targetUserId } = request.params as { id: string };
    if (user.userId !== targetUserId) Guards.tenants(user.role);
    const membershipInTenant = await this.membershipRepository.findByUserIdAndTenantId(
      targetUserId,
      tenantId
    );
    const targetInTenant = !!membershipInTenant;
    if (!canExportUser(user.userId, user.role, targetUserId, targetInTenant)) {
      throw new ForbiddenError('Not allowed to export this user\'s data');
    }
    const data = await this.exportUserDataUseCase.execute(targetUserId);
    await reply.status(200).send(data);
  }

  private async updateRole(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const { id } = request.params as { id: string };
    const body = updateRoleBodySchema.parse(request.body);
    const result = await this.updateRoleUseCase.execute({
      userId: id,
      tenantId,
      actorUserId: user.userId,
      role: body.role,
    });
    await reply.status(200).send(result);
  }

  private async delete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const { id } = request.params as { id: string };
    await this.deleteUserUseCase.execute({
      userId: id,
      tenantId,
      actorUserId: user.userId,
    });
    await reply.status(204).send();
  }

  private async activate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const { id } = request.params as { id: string };
    const result = await this.setActiveUseCase.execute({
      userId: id,
      tenantId,
      actorUserId: user.userId,
      active: true,
    });
    await reply.status(200).send(result);
  }

  private async deactivate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.tenants(user.role);
    const { id } = request.params as { id: string };
    const result = await this.setActiveUseCase.execute({
      userId: id,
      tenantId,
      actorUserId: user.userId,
      active: false,
    });
    await reply.status(200).send(result);
  }
}
