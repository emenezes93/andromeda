import type { IGoalRepository } from '@ports/repositories/IGoalRepository.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface DeleteGoalRequest {
  goalId: string;
  tenantId: string;
  actorUserId: string;
}

export class DeleteGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: DeleteGoalRequest): Promise<void> {
    const existing = await this.goalRepository.findById(
      request.goalId,
      request.tenantId
    );
    if (!existing || existing.isDeleted()) throw new NotFoundError('Meta não encontrada');

    await this.goalRepository.softDelete(request.goalId, request.tenantId);
    await this.auditService.log(
      request.tenantId,
      'delete',
      'goal',
      request.goalId,
      request.actorUserId
    );
  }
}
