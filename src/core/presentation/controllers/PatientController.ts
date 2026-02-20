import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
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
    private readonly deletePatientUseCase: DeletePatientUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get('/v1/patients', { schema: { querystring: { type: 'object', properties: { page: {}, limit: {}, search: {} } } } }, this.list.bind(this));
    app.get(
      '/v1/patients/:id',
      { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
      this.get.bind(this)
    );
    app.post('/v1/patients', { schema: { body: { type: 'object' } } }, this.create.bind(this));
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
}
