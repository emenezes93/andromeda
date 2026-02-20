import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetTenantRequest {
  tenantId: string;
}

export interface GetTenantResponse {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
}

export class GetTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(request: GetTenantRequest): Promise<GetTenantResponse> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant || tenant.isDeleted()) throw new NotFoundError('Tenant not found');
    return {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
    };
  }
}
