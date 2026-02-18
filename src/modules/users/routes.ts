import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { createUserSchema } from './schemas.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError, BadRequestError } from '@shared/errors/index.js';

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
        params: { id: { type: 'string' } },
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
      });
    }
  );
}
