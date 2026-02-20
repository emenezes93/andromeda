import type { IAuditService } from '@ports/services/IAuditService.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import { ConflictError } from '@shared/errors/index.js';

export interface CreateTenantRequest {
  name: string;
  status?: 'active' | 'suspended';
  actorUserId: string;
  actorTenantId: string;
}

export interface CreateTenantResponse {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
}

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    const exists = await this.tenantRepository.existsByName(request.name);
    if (exists) {
      throw new ConflictError('Tenant name already exists');
    }
    const tenant = await this.tenantRepository.create({
      name: request.name,
      status: request.status ?? 'active',
    });
    await this.auditService.log(
      request.actorTenantId,
      'create',
      'tenant',
      tenant.id,
      request.actorUserId,
      { name: tenant.name }
    );
    return {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
    };
  }
}
