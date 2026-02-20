import type { IGoalRepository } from '@ports/repositories/IGoalRepository.js';
import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import { NotFoundError, BadRequestError } from '@shared/errors/index.js';

export interface CreateGoalRequest {
  tenantId: string;
  patientId: string;
  type: string;
  title: string;
  description?: string | null;
  currentValue?: number | null;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  actorUserId: string;
}

export class CreateGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: CreateGoalRequest) {
    const patient = await this.patientRepository.findById(
      request.patientId,
      request.tenantId
    );
    if (!patient || patient.isDeleted()) throw new NotFoundError('Patient not found');

    const startDate = new Date(request.startDate);
    const targetDate = new Date(request.targetDate);
    if (targetDate <= startDate) {
      throw new BadRequestError('Target date must be after start date');
    }

    const goal = await this.goalRepository.create({
      tenantId: request.tenantId,
      patientId: request.patientId,
      type: request.type,
      title: request.title,
      description: request.description ?? null,
      currentValue: request.currentValue ?? null,
      targetValue: request.targetValue,
      unit: request.unit,
      startDate,
      targetDate,
    });

    await this.auditService.log(
      request.tenantId,
      'create',
      'goal',
      goal.id,
      request.actorUserId,
      { patientId: request.patientId, type: request.type, title: request.title }
    );

    return {
      id: goal.id,
      patientId: goal.patientId,
      type: goal.type,
      title: goal.title,
      targetValue: goal.targetValue,
      targetDate: goal.targetDate.toISOString(),
    };
  }
}
