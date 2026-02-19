import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { createUserSchema } from './schemas.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '@shared/errors/index.js';
import { paginationQuerySchema, skipFor } from '@shared/utils/pagination.js';
import { auditLog } from '@shared/utils/audit.js';

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'practitioner', 'viewer']),
});

export async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/users',
    {
      schema: {
        body: { $ref: 'CreateUserBody#' },
        response: { 201: { $ref: 'UserResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const body = createUserSchema.parse(request.body);
      const existing = await fastify.prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        const membership = await fastify.prisma.membership.findUnique({
          where: { userId_tenantId: { userId: existing.id, tenantId } },
        });
        if (membership) throw new BadRequestError('User already in tenant');
      }

      let targetUser = existing;
      if (!targetUser) {
        const passwordHash = await bcrypt.hash(body.password, 12);
        targetUser = await fastify.prisma.user.create({
          data: { email: body.email, passwordHash, name: body.name ?? null },
        });
        // Set password changed date and expiry (90 days)
        const { calculatePasswordExpiry, savePasswordHistory } = await import('../auth/password-policy.js');
        const passwordExpiresAt = calculatePasswordExpiry(90);
        await fastify.prisma.user.update({
          where: { id: targetUser.id },
          data: {
            passwordChangedAt: new Date(),
            passwordExpiresAt,
          },
        });
        // Save to password history
        await savePasswordHistory(fastify.prisma, targetUser.id, passwordHash);
      }

      await fastify.prisma.membership.create({
        data: { userId: targetUser.id, tenantId, role: body.role },
      });

      return reply.status(201).send({
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      });
    }
  );

  fastify.get(
    '/v1/users/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: { 200: { $ref: 'UserResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { id } = request.params as { id: string };
      const membership = await fastify.prisma.membership.findUnique({
        where: { userId_tenantId: { userId: id, tenantId } },
        include: { user: true },
      });
      if (!membership) throw new NotFoundError('User not found');
      return reply.status(200).send({
        id: membership.user.id,
        email: membership.user.email,
        name: membership.user.name,
        role: membership.role,
        active: membership.active,
      });
    }
  );

  fastify.get(
    '/v1/users',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            active: { type: 'string' }, // 'true' | 'false' | undefined
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const { page, limit } = paginationQuerySchema.parse(request.query);
      const skip = skipFor(page, limit);

      const { active: activeFilter } = request.query as { active?: string };
      const where: { tenantId: string; active?: boolean } = { tenantId };
      if (activeFilter !== undefined) {
        where.active = activeFilter === 'true';
      }

      const [memberships, total] = await Promise.all([
        fastify.prisma.membership.findMany({
          where,
          include: { user: true },
          orderBy: { role: 'desc' },
          skip,
          take: limit,
        }),
        fastify.prisma.membership.count({ where }),
      ]);

      const data = memberships.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
        active: m.active,
      }));

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

  fastify.patch(
    '/v1/users/:id/role',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const { id } = request.params as { id: string };
      const body = updateRoleSchema.parse(request.body);

      if (user.userId === id) {
        throw new ForbiddenError('Cannot change your own role');
      }

      const membership = await fastify.prisma.membership.findUnique({
        where: { userId_tenantId: { userId: id, tenantId } },
      });
      if (!membership) throw new NotFoundError('User not found');

      if (membership.role === 'owner') {
        throw new ForbiddenError('Cannot change the role of an owner');
      }

      const updated = await fastify.prisma.membership.update({
        where: { userId_tenantId: { userId: id, tenantId } },
        data: { role: body.role },
        include: { user: true },
      });

      return reply.status(200).send({
        id: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
        active: updated.active,
      });
    }
  );

  fastify.delete(
    '/v1/users/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const { id } = request.params as { id: string };

      if (user.userId === id) {
        throw new ForbiddenError('Cannot remove yourself from the tenant');
      }

      const membership = await fastify.prisma.membership.findUnique({
        where: { userId_tenantId: { userId: id, tenantId } },
      });
      if (!membership) throw new NotFoundError('User not found');

      if (membership.role === 'owner') {
        throw new ForbiddenError('Cannot remove an owner from the tenant');
      }

      await fastify.prisma.membership.delete({
        where: { userId_tenantId: { userId: id, tenantId } },
      });

      return reply.status(204).send();
    }
  );

  fastify.patch(
    '/v1/users/:id/activate',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: { 200: { $ref: 'UserResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const { id } = request.params as { id: string };

      if (user.userId === id) {
        throw new ForbiddenError('Cannot activate/deactivate yourself');
      }

      const membership = await fastify.prisma.membership.findUnique({
        where: { userId_tenantId: { userId: id, tenantId } },
        include: { user: true },
      });
      if (!membership) throw new NotFoundError('User not found');

      if (membership.role === 'owner') {
        throw new ForbiddenError('Cannot activate/deactivate an owner');
      }

      const updated = await fastify.prisma.membership.update({
        where: { userId_tenantId: { userId: id, tenantId } },
        data: { active: true },
        include: { user: true },
      });

      await auditLog(fastify.prisma, tenantId, 'activate_user', 'user', id, user.userId, {
        email: updated.user.email,
      });

      return reply.status(200).send({
        id: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
        active: updated.active,
      });
    }
  );

  fastify.patch(
    '/v1/users/:id/deactivate',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: { 200: { $ref: 'UserResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const { id } = request.params as { id: string };

      if (user.userId === id) {
        throw new ForbiddenError('Cannot activate/deactivate yourself');
      }

      const membership = await fastify.prisma.membership.findUnique({
        where: { userId_tenantId: { userId: id, tenantId } },
        include: { user: true },
      });
      if (!membership) throw new NotFoundError('User not found');

      if (membership.role === 'owner') {
        throw new ForbiddenError('Cannot activate/deactivate an owner');
      }

      const updated = await fastify.prisma.membership.update({
        where: { userId_tenantId: { userId: id, tenantId } },
        data: { active: false },
        include: { user: true },
      });

      // Revoke all refresh tokens for this user in this tenant
      await fastify.prisma.refreshToken.updateMany({
        where: { userId: id, tenantId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await auditLog(fastify.prisma, tenantId, 'deactivate_user', 'user', id, user.userId, {
        email: updated.user.email,
      });

      return reply.status(200).send({
        id: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
        active: updated.active,
      });
    }
  );
}
