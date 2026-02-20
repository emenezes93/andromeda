import type { IAuditService } from '@ports/services/IAuditService.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface SuspendTenantRequest {
  tenantId: string;
  actorUserId: string;
  actorTenantId: string;
}

export interface SuspendTenantResponse {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
}

/**
 * Use case: Suspend tenant (owner only, global access). Uses Tenant.suspend() method.
 */
export class SuspendTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: SuspendTenantRequest): Promise<SuspendTenantResponse> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant || tenant.isDeleted()) throw new NotFoundError('Tenant not found');

    const suspended = await this.tenantRepository.suspend(request.tenantId);

    await this.auditService.log(
      request.actorTenantId,
      'suspend',
      'tenant',
      suspended.id,
      request.actorUserId,
      { name: suspended.name }
    );

    return {
      id: suspended.id,
      name: suspended.name,
      status: suspended.status,
      createdAt: suspended.createdAt,
    };
  }
}
