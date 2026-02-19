import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { skipFor } from '@shared/utils/pagination.js';
import { auditLog } from '@shared/utils/audit.js';
import {
  createPatientSchema,
  updatePatientSchema,
  createEvolutionSchema,
  listPatientsQuerySchema,
} from './schemas.js';

export async function patientsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /v1/patients — list with pagination + optional search by fullName
  fastify.get(
    '/v1/patients',
    {
      schema: {
        querystring: {
          page: { type: 'number' },
          limit: { type: 'number' },
          search: { type: 'string' },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { page, limit, search } = listPatientsQuerySchema.parse(request.query);
      const skip = skipFor(page, limit);

      const where = {
        tenantId,
        deletedAt: null,
        ...(search
          ? { fullName: { contains: search, mode: 'insensitive' as const } }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { fullName: 'asc' },
          include: {
            _count: {
              select: { sessions: true, evolutions: true },
            },
          },
        }),
        fastify.prisma.patient.count({ where }),
      ]);

      return reply.status(200).send({
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );

  // POST /v1/patients — create patient
  fastify.post(
    '/v1/patients',
    {
      schema: {
        body: { type: 'object' },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createPatientSchema.parse(request.body);
      const consentAcceptedAt = body.consentVersion ? new Date() : undefined;

      const patient = await fastify.prisma.patient.create({
        data: {
          tenantId,
          ...body,
          consentVersion: body.consentVersion ?? undefined,
          consentAcceptedAt,
        },
      });

      await auditLog(fastify.prisma, tenantId, 'create', 'patient', patient.id, user.userId);

      return reply.status(201).send(patient);
    }
  );

  // GET /v1/patients/:id — get patient with session and evolution counts
  fastify.get(
    '/v1/patients/:id',
    {
      schema: {
        params: { id: { type: 'string' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { id } = request.params as { id: string };

      const patient = await fastify.prisma.patient.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          _count: {
            select: { sessions: true, evolutions: true },
          },
        },
      });

      if (!patient) throw new NotFoundError('Patient not found');

      return reply.status(200).send(patient);
    }
  );

  // PATCH /v1/patients/:id — update patient fields
  fastify.patch(
    '/v1/patients/:id',
    {
      schema: {
        params: { id: { type: 'string' } },
        body: { type: 'object' },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = updatePatientSchema.parse(request.body);

      const existing = await fastify.prisma.patient.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Patient not found');

      const consentAcceptedAt =
        body.consentVersion != null ? new Date() : undefined;

      const patient = await fastify.prisma.patient.update({
        where: { id, tenantId },
        data: {
          ...body,
          ...(consentAcceptedAt && { consentAcceptedAt }),
          updatedAt: new Date(),
        },
      });

      await auditLog(fastify.prisma, tenantId, 'update', 'patient', patient.id, user.userId);

      return reply.status(200).send(patient);
    }
  );

  // GET /v1/patients/:id/evolutions — list evolutions ordered by recordedAt desc
  fastify.get(
    '/v1/patients/:id/evolutions',
    {
      schema: {
        params: { id: { type: 'string' } },
        querystring: {
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { id: patientId } = request.params as { id: string };

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Patient not found');

      const { page, limit } = listPatientsQuerySchema.parse(request.query);
      const skip = skipFor(page, limit);

      const where = { tenantId, patientId };

      const [items, total] = await Promise.all([
        fastify.prisma.patientEvolution.findMany({
          where,
          skip,
          take: limit,
          orderBy: { recordedAt: 'desc' },
        }),
        fastify.prisma.patientEvolution.count({ where }),
      ]);

      return reply.status(200).send({
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );

  // POST /v1/patients/:id/evolutions — create evolution record
  fastify.post(
    '/v1/patients/:id/evolutions',
    {
      schema: {
        params: { id: { type: 'string' } },
        body: { type: 'object' },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id: patientId } = request.params as { id: string };
      const body = createEvolutionSchema.parse(request.body);

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Patient not found');

      const evolution = await fastify.prisma.patientEvolution.create({
        data: {
          tenantId,
          patientId,
          ...body,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'patient_evolution',
        evolution.id,
        user.userId
      );

      return reply.status(201).send(evolution);
    }
  );
}
