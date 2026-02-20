import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';
import { skipFor } from '@shared/utils/pagination.js';
import { listPatientsQuerySchema, createEvolutionSchema } from '../../schemas/patients.js';

/**
 * Legacy routes: patient CSV export and evolutions.
 * CRUD is handled by PatientController (hexagonal).
 */
export async function patientsLegacyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/v1/patients/export/csv',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { search: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);
      const { search } = listPatientsQuerySchema.partial().parse(request.query);
      const where = {
        tenantId,
        deletedAt: null,
        ...(search ? { fullName: { contains: search, mode: 'insensitive' as const } } : {}),
      };
      const patients = await fastify.prisma.patient.findMany({
        where,
        orderBy: { fullName: 'asc' },
        include: {
          _count: { select: { sessions: true } },
          evolutions: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
            select: { recordedAt: true },
          },
        },
      });
      const csvRows = [
        ['Nome', 'Email', 'Última Evolução', 'Nº Sessões'].join(','),
        ...patients.map((p) => {
          const lastEvolution = p.evolutions[0]?.recordedAt
            ? new Date(p.evolutions[0].recordedAt).toLocaleDateString('pt-BR')
            : '—';
          const email = p.email ?? '—';
          const name = p.fullName.replace(/"/g, '""');
          return [`"${name}"`, `"${email}"`, `"${lastEvolution}"`, p._count.sessions].join(',');
        }),
      ];
      const csv = csvRows.join('\n');
      const bom = '\ufeff';
      reply
        .type('text/csv; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="pacientes.csv"')
        .status(200)
        .send(bom + csv);
    }
  );

  fastify.get(
    '/v1/patients/:id/evolutions',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        querystring: { type: 'object', properties: { page: {}, limit: {} } },
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
      const where = { tenantId, patientId };
      const [items, total] = await Promise.all([
        fastify.prisma.patientEvolution.findMany({
          where,
          skip: skipFor(page, limit),
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

  fastify.get(
    '/v1/patients/:id/evolution-report',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        querystring: { type: 'object', properties: { format: { type: 'string', enum: ['html'] } } },
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
      const evolutions = await fastify.prisma.patientEvolution.findMany({
        where: { tenantId, patientId },
        orderBy: { recordedAt: 'asc' },
      });
      const rows = evolutions
        .map(
          (e) => `
        <tr>
          <td>${new Date(e.recordedAt).toLocaleDateString('pt-BR')}</td>
          <td>${e.weightKg ?? '—'}</td>
          <td>${e.heightCm ?? '—'}</td>
          <td>${e.bmi ?? '—'}</td>
          <td>${e.waistCm ?? '—'}</td>
          <td>${e.hipCm ?? '—'}</td>
          <td>${e.bodyFatPercent ?? '—'}</td>
          <td>${e.bloodPressureSystolic ?? '—'}/${e.bloodPressureDiastolic ?? '—'}</td>
          <td>${e.heartRateBpm ?? '—'}</td>
          <td>${e.notes ? String(e.notes).replace(/</g, '&lt;') : '—'}</td>
        </tr>`
        )
        .join('');
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Evolução - ${patient.fullName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.5; }
    h1 { color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
    .meta { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f0f9ff; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Relatório de Evolução Biométrica</h1>
  <div class="meta">
    <p><strong>Paciente:</strong> ${patient.fullName}</p>
    <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Peso (kg)</th>
        <th>Altura (cm)</th>
        <th>IMC</th>
        <th>Cintura (cm)</th>
        <th>Quadril (cm)</th>
        <th>% Gordura</th>
        <th>PA (mmHg)</th>
        <th>FC (bpm)</th>
        <th>Observações</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="10">Nenhum registro de evolução.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
      reply.type('text/html; charset=utf-8').status(200).send(html);
    }
  );

  fastify.post(
    '/v1/patients/:id/evolutions',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
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
        data: { tenantId, patientId, ...body },
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
