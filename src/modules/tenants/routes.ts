import type { FastifyInstance } from 'fastify';
import { createTenantSchema, updateTenantSchema } from './schemas.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { requireRole } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';
import { paginationQuerySchema, skipFor } from '@shared/utils/pagination.js';

export async function tenantsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
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
    async (request, reply) => {
      requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'owner');

      const { page, limit } = paginationQuerySchema.parse(request.query);
      const skip = skipFor(page, limit);

      const [data, total] = await Promise.all([
        fastify.prisma.tenant.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        fastify.prisma.tenant.count({ where: { deletedAt: null } }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      return reply.status(200).send({
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    }
  );

  fastify.post(
    '/v1/tenants',
    {
      schema: {
        body: { $ref: 'CreateTenantBody#' },
        response: { 201: { $ref: 'TenantResponse#' } },
      },
    },
    async (request, reply) => {
      requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'owner');

      const body = createTenantSchema.parse(request.body);
      const tenant = await fastify.prisma.tenant.create({
        data: { name: body.name, status: body.status },
      });
      await auditLog(fastify.prisma, user.tenantId, 'create', 'tenant', tenant.id, user.userId, {
        name: tenant.name,
      });
      return reply.status(201).send(tenant);
    }
  );

  fastify.get(
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
    async (request, reply) => {
      requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'owner');

      const { id } = request.params as { id: string };
      const tenant = await fastify.prisma.tenant.findUnique({ where: { id } });
      if (!tenant || tenant.deletedAt) throw new NotFoundError('Tenant not found');
      return reply.status(200).send(tenant);
    }
  );

  fastify.patch(
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
    async (request, reply) => {
      requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'owner');

      const { id } = request.params as { id: string };
      const body = updateTenantSchema.parse(request.body);

      const tenant = await fastify.prisma.tenant.findUnique({ where: { id } });
      if (!tenant || tenant.deletedAt) throw new NotFoundError('Tenant not found');

      const updated = await fastify.prisma.tenant.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.status !== undefined && { status: body.status }),
        },
      });
      await auditLog(fastify.prisma, user.tenantId, 'update', 'tenant', id, user.userId, {
        name: updated.name,
        status: updated.status,
      });
      return reply.status(200).send(updated);
    }
  );
}
