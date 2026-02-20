import type { IGoalRepository } from '@ports/repositories/IGoalRepository.js';
import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetGoalRequest {
  goalId: string;
  tenantId: string;
}

export class GetGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: GetGoalRequest) {
    const goal = await this.goalRepository.findById(request.goalId, request.tenantId);
    if (!goal || goal.isDeleted()) throw new NotFoundError('Meta não encontrada');
    const patient = await this.patientRepository.findById(goal.patientId, request.tenantId);
    const patientName = patient ? patient.fullName : '';
    return {
      id: goal.id,
      patientId: goal.patientId,
      patientName,
      type: goal.type,
      title: goal.title,
      description: goal.description,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      unit: goal.unit,
      startDate: goal.startDate.toISOString(),
      targetDate: goal.targetDate.toISOString(),
      achievedAt: goal.achievedAt != null ? goal.achievedAt.toISOString() : null,
      progressPercent: goal.progressPercent(),
    };
  }
}
