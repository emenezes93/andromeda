import type { IGoalRepository } from '@ports/repositories/IGoalRepository.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface UpdateGoalRequest {
  goalId: string;
  tenantId: string;
  actorUserId: string;
  title?: string;
  description?: string | null;
  currentValue?: number | null;
  targetValue?: number;
  targetDate?: string;
  achievedAt?: string | null;
}

export class UpdateGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: UpdateGoalRequest) {
    const existing = await this.goalRepository.findById(
      request.goalId,
      request.tenantId
    );
    if (!existing || existing.isDeleted()) throw new NotFoundError('Meta não encontrada');

    const updateData: {
      title?: string;
      description?: string | null;
      currentValue?: number | null;
      targetValue?: number;
      targetDate?: Date;
      achievedAt?: Date | null;
    } = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description ?? null;
    if (request.currentValue !== undefined) updateData.currentValue = request.currentValue ?? null;
    if (request.targetValue !== undefined) updateData.targetValue = request.targetValue;
    if (request.targetDate !== undefined) updateData.targetDate = new Date(request.targetDate);
    if (request.achievedAt !== undefined) {
      updateData.achievedAt = request.achievedAt ? new Date(request.achievedAt) : null;
    }

    const goal = await this.goalRepository.update(
      request.goalId,
      request.tenantId,
      updateData
    );

    await this.auditService.log(
      request.tenantId,
      'update',
      'goal',
      goal.id,
      request.actorUserId,
      { changes: Object.keys(updateData) }
    );

    return {
      id: goal.id,
      patientId: goal.patientId,
      type: goal.type,
      title: goal.title,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      targetDate: goal.targetDate.toISOString(),
      achievedAt: goal.achievedAt?.toISOString() ?? null,
    };
  }
}
