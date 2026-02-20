import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import {
  createGoalSchema,
  updateGoalSchema,
  listGoalsQuerySchema,
} from '../../../schemas/goals.js';
import type { ListGoalsUseCase } from '@application/use-cases/goals/ListGoalsUseCase.js';
import type { GetGoalUseCase } from '@application/use-cases/goals/GetGoalUseCase.js';
import type { CreateGoalUseCase } from '@application/use-cases/goals/CreateGoalUseCase.js';
import type { UpdateGoalUseCase } from '@application/use-cases/goals/UpdateGoalUseCase.js';
import type { DeleteGoalUseCase } from '@application/use-cases/goals/DeleteGoalUseCase.js';

export class GoalController {
  constructor(
    private readonly listGoalsUseCase: ListGoalsUseCase,
    private readonly getGoalUseCase: GetGoalUseCase,
    private readonly createGoalUseCase: CreateGoalUseCase,
    private readonly updateGoalUseCase: UpdateGoalUseCase,
    private readonly deleteGoalUseCase: DeleteGoalUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post('/v1/goals', { schema: { body: { type: 'object', required: ['patientId', 'type', 'title', 'targetValue', 'unit', 'startDate', 'targetDate'], properties: { patientId: { type: 'string' }, type: { type: 'string', enum: ['weight_loss', 'muscle_gain', 'performance', 'health', 'other'] }, title: { type: 'string' }, description: { type: 'string' }, currentValue: { type: 'number' }, targetValue: { type: 'number' }, unit: { type: 'string' }, startDate: { type: 'string' }, targetDate: { type: 'string' } } }, response: { 201: { type: 'object', properties: { id: { type: 'string' }, patientId: { type: 'string' }, type: { type: 'string' }, title: { type: 'string' }, targetValue: { type: 'number' }, targetDate: { type: 'string' } } } } } }, this.create.bind(this));
    app.get('/v1/goals', { schema: { querystring: { type: 'object', properties: { page: { type: 'number' }, limit: { type: 'number' }, patientId: { type: 'string' }, type: { type: 'string' }, achieved: { type: 'boolean' } } } } }, this.list.bind(this));
    app.get<{ Params: { id: string } }>('/v1/goals/:id', { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } }, this.get.bind(this));
    app.patch<{ Params: { id: string } }>('/v1/goals/:id', { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } }, body: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, currentValue: { type: 'number' }, targetValue: { type: 'number' }, targetDate: { type: 'string' }, achievedAt: { type: 'string' } } } } }, this.update.bind(this));
    app.delete<{ Params: { id: string } }>('/v1/goals/:id', { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } }, this.delete.bind(this));
  }

  private async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const body = createGoalSchema.parse(request.body);
    const result = await this.createGoalUseCase.execute({
      tenantId,
      patientId: body.patientId,
      type: body.type,
      title: body.title,
      description: body.description,
      currentValue: body.currentValue,
      targetValue: body.targetValue,
      unit: body.unit,
      startDate: body.startDate,
      targetDate: body.targetDate,
      actorUserId: user.userId,
    });
    await reply.status(201).send(result);
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const query = listGoalsQuerySchema.parse(request.query);
    const result = await this.listGoalsUseCase.execute({
      tenantId,
      page: query.page,
      limit: query.limit,
      patientId: query.patientId,
      type: query.type,
      achieved: query.achieved,
    });
    await reply.status(200).send(result);
  }

  private async get(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const result = await this.getGoalUseCase.execute({
      goalId: request.params.id,
      tenantId,
    });
    await reply.status(200).send(result);
  }

  private async update(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const body = updateGoalSchema.parse(request.body);
    const result = await this.updateGoalUseCase.execute({
      goalId: request.params.id,
      tenantId,
      actorUserId: user.userId,
      title: body.title,
      description: body.description,
      currentValue: body.currentValue,
      targetValue: body.targetValue,
      targetDate: body.targetDate,
      achievedAt: body.achievedAt,
    });
    await reply.status(200).send(result);
  }

  private async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    await this.deleteGoalUseCase.execute({
      goalId: request.params.id,
      tenantId,
      actorUserId: user.userId,
    });
    await reply.status(204).send();
  }
}
