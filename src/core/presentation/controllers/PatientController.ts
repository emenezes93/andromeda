import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { requireRole } from '@shared/utils/rbac.js';
import { listPatientsQuerySchema } from '../../../schemas/patients.js';
import type { ListPatientsUseCase } from '@application/use-cases/patients/ListPatientsUseCase.js';
import type { GetPatientUseCase } from '@application/use-cases/patients/GetPatientUseCase.js';
import type { CreatePatientUseCase } from '@application/use-cases/patients/CreatePatientUseCase.js';
import type { UpdatePatientUseCase } from '@application/use-cases/patients/UpdatePatientUseCase.js';
import type { DeletePatientUseCase } from '@application/use-cases/patients/DeletePatientUseCase.js';
import type { GetPatientTimelineUseCase } from '@application/use-cases/patients/GetPatientTimelineUseCase.js';
import type { GetPatientHubSummaryUseCase } from '@application/use-cases/patients/GetPatientHubSummaryUseCase.js';

const createPatientBodySchema = z.object({
  fullName: z.string().min(2).max(255),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)')
    .optional()
    .nullable(),
  gender: z.enum(['M', 'F', 'Other', 'Prefer not to say']).optional().nullable(),
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos')
    .optional()
    .nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  profession: z.string().max(100).optional().nullable(),
  mainGoal: z.string().max(2000).optional().nullable(),
  mainComplaint: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  consentVersion: z.string().max(20).optional(),
});

const updatePatientBodySchema = createPatientBodySchema.partial();

function parseBirthDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export class PatientController {
  constructor(
    private readonly listPatientsUseCase: ListPatientsUseCase,
    private readonly getPatientUseCase: GetPatientUseCase,
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly deletePatientUseCase: DeletePatientUseCase,
    private readonly getPatientTimelineUseCase?: GetPatientTimelineUseCase,
    private readonly getPatientHubSummaryUseCase?: GetPatientHubSummaryUseCase,
    private readonly prisma?: PrismaClient
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get('/v1/patients', { schema: { querystring: { type: 'object', properties: { page: {}, limit: {}, search: {} } } } }, this.list.bind(this));
    app.get(
      '/v1/patients/export/csv',
      { schema: { querystring: { type: 'object', properties: { search: { type: 'string' } } } } },
      this.exportCsv.bind(this)
    );
    app.get(
      '/v1/patients/:id',
      { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
      this.get.bind(this)
    );
    app.post('/v1/patients', { schema: { body: { type: 'object' } } }, this.create.bind(this));
    app.post('/v1/patients/import', { schema: { body: { type: 'object' } } }, this.importCsv.bind(this));
    app.patch(
      '/v1/patients/:id',
      { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } }, body: { type: 'object' } } },
      this.update.bind(this)
    );
    app.delete(
      '/v1/patients/:id',
      { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
      this.delete.bind(this)
    );
    if (this.getPatientTimelineUseCase) {
      app.get(
        '/v1/patients/:id/timeline',
        { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } }, querystring: { type: 'object', properties: { limit: { type: 'integer' } } } } },
        this.getTimeline.bind(this)
      );
    }
    if (this.getPatientHubSummaryUseCase) {
      app.get(
        '/v1/patients/:id/hub-summary',
        {
          schema: {
            params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
            response: { 200: { type: 'object' } },
          },
        },
        this.getHubSummary.bind(this)
      );
    }
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const query = listPatientsQuerySchema.parse(request.query);
    const result = await this.listPatientsUseCase.execute({
      tenantId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      mainGoal: query.mainGoal,
      hasActivePlan: query.hasActivePlan,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
    });
    await reply.status(200).send(result);
  }

  private async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const { id } = request.params as { id: string };
    const result = await this.getPatientUseCase.execute({ patientId: id, tenantId });
    await reply.status(200).send(result);
  }

  private async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);
    const body = createPatientBodySchema.parse(request.body);
    const result = await this.createPatientUseCase.execute({
      tenantId,
      actorUserId: user.userId,
      fullName: body.fullName,
      birthDate: parseBirthDate(body.birthDate ?? undefined),
      gender: body.gender,
      cpf: body.cpf,
      email: body.email,
      phone: body.phone,
      profession: body.profession,
      mainGoal: body.mainGoal,
      mainComplaint: body.mainComplaint,
      notes: body.notes,
      consentVersion: body.consentVersion,
    });
    await reply.status(201).send(result);
  }

  private async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);
    const { id } = request.params as { id: string };
    const body = updatePatientBodySchema.parse(request.body);
    const result = await this.updatePatientUseCase.execute({
      patientId: id,
      tenantId,
      actorUserId: user.userId,
      fullName: body.fullName,
      birthDate: body.birthDate !== undefined ? parseBirthDate(body.birthDate) : undefined,
      gender: body.gender,
      cpf: body.cpf,
      email: body.email,
      phone: body.phone,
      profession: body.profession,
      mainGoal: body.mainGoal,
      mainComplaint: body.mainComplaint,
      notes: body.notes,
      consentVersion: body.consentVersion,
    });
    await reply.status(200).send(result);
  }

  private async delete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    requireRole(user.role, 'admin');
    const { id } = request.params as { id: string };
    await this.deletePatientUseCase.execute({
      patientId: id,
      tenantId,
      actorUserId: user.userId,
    });
    await reply.status(204).send();
  }

  private async importCsv(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const { rows } = request.body as { rows: Array<Record<string, string>> };
    if (!Array.isArray(rows) || rows.length === 0) {
      await reply.status(400).send({ error: 'Nenhuma linha enviada' });
      return;
    }
    if (rows.length > 500) {
      await reply.status(400).send({ error: 'Máximo 500 linhas por importação' });
      return;
    }

    const results: Array<{ row: number; status: 'ok' | 'error'; error?: string; patientId?: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      try {
        const body = createPatientBodySchema.parse({
          fullName: raw.nome || raw.fullName || raw.name,
          email: raw.email || undefined,
          phone: raw.telefone || raw.phone || undefined,
          cpf: raw.cpf?.replace(/\D/g, '') || undefined,
          birthDate: raw.data_nascimento || raw.birthDate || undefined,
          gender: raw.sexo || raw.gender || undefined,
          profession: raw.profissao || raw.profession || undefined,
          mainGoal: raw.objetivo || raw.mainGoal || undefined,
          notes: raw.observacoes || raw.notes || undefined,
        });
        const result = await this.createPatientUseCase.execute({
          tenantId,
          actorUserId: user.userId,
          fullName: body.fullName,
          birthDate: parseBirthDate(body.birthDate ?? undefined),
          gender: body.gender,
          cpf: body.cpf,
          email: body.email,
          phone: body.phone,
          profession: body.profession,
          mainGoal: body.mainGoal,
          notes: body.notes,
        });
        results.push({ row: i + 1, status: 'ok', patientId: result.id });
      } catch (err) {
        const msg =
          err instanceof z.ZodError
            ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
            : err instanceof Error
              ? err.message
              : 'Erro desconhecido';
        results.push({ row: i + 1, status: 'error', error: msg });
      }
    }

    const imported = results.filter((r) => r.status === 'ok').length;
    const failed = results.filter((r) => r.status === 'error').length;
    await reply.status(200).send({ imported, failed, total: rows.length, results });
  }

  private async exportCsv(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const query = request.query as { search?: string };

    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    if (this.prisma) {
      const where = {
        tenantId,
        deletedAt: null,
        ...(query.search
          ? { fullName: { contains: query.search, mode: 'insensitive' as const } }
          : {}),
      };
      const rows = await this.prisma.patient.findMany({
        where,
        orderBy: { fullName: 'asc' },
        take: 10000,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          cpf: true,
          birthDate: true,
          gender: true,
          profession: true,
          createdAt: true,
          _count: { select: { sessions: true } },
          evolutions: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
            select: { recordedAt: true },
          },
        },
      });
      const header =
        'nome,email,última_evolução,nº_sessões,telefone,cpf,data_nascimento,sexo,profissão,criado_em';
      const csvRows = rows.map((p) => {
        const lastEvo = p.evolutions[0]?.recordedAt;
        return [
          p.fullName,
          p.email ?? '',
          lastEvo ? lastEvo.toISOString().slice(0, 10) : '',
          String(p._count.sessions),
          p.phone ?? '',
          p.cpf ?? '',
          p.birthDate ? p.birthDate.toISOString().slice(0, 10) : '',
          p.gender ?? '',
          p.profession ?? '',
          p.createdAt.toISOString().slice(0, 10),
        ]
          .map(escape)
          .join(',');
      });
      const csv = [header, ...csvRows].join('\r\n');
      await reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="pacientes.csv"')
        .status(200)
        .send(csv);
      return;
    }

    const result = await this.listPatientsUseCase.execute({
      tenantId,
      page: 1,
      limit: 10000,
      search: query.search,
    });
    const header = 'id,fullName,email,phone,cpf,birthDate,gender,profession,createdAt';
    const rows = result.data.map((p) =>
      [p.id, p.fullName, p.email, p.phone, p.cpf, p.birthDate, p.gender, p.profession, p.createdAt]
        .map(escape)
        .join(',')
    );
    const csv = [header, ...rows].join('\r\n');
    await reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="pacientes.csv"')
      .status(200)
      .send(csv);
  }

  private async getTimeline(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const { id } = request.params as { id: string };
    const query = request.query as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const result = await this.getPatientTimelineUseCase!.execute({ patientId: id, tenantId, limit });
    await reply.status(200).send(result);
  }

  private async getHubSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);
    const { id } = request.params as { id: string };
    const result = await this.getPatientHubSummaryUseCase!.execute({ patientId: id, tenantId });
    await reply.status(200).send(result);
  }
}
