import type { IAuditService } from '@ports/services/IAuditService.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface ActivateTenantRequest {
  tenantId: string;
  actorUserId: string;
  actorTenantId: string;
}

export interface ActivateTenantResponse {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
}

/**
 * Use case: Activate tenant (owner only, global access). Uses Tenant.activate() method.
 */
export class ActivateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: ActivateTenantRequest): Promise<ActivateTenantResponse> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant || tenant.isDeleted()) throw new NotFoundError('Tenant not found');

    const activated = await this.tenantRepository.activate(request.tenantId);

    await this.auditService.log(
      request.actorTenantId,
      'activate',
      'tenant',
      activated.id,
      request.actorUserId,
      { name: activated.name }
    );

    return {
      id: activated.id,
      name: activated.name,
      status: activated.status,
      createdAt: activated.createdAt,
    };
  }
}
