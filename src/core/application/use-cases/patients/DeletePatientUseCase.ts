import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface DeletePatientRequest {
  patientId: string;
  tenantId: string;
  actorUserId: string;
}

/**
 * Use case: Soft delete patient (admin+). Audits.
 */
export class DeletePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: DeletePatientRequest): Promise<void> {
    const patient = await this.patientRepository.findById(request.patientId, request.tenantId);
    if (!patient || patient.isDeleted()) throw new NotFoundError('Patient not found');
    await this.patientRepository.delete(request.patientId, request.tenantId);
    await this.auditService.log(
      request.tenantId,
      'delete',
      'patient',
      request.patientId,
      request.actorUserId,
      {}
    );
  }
}
