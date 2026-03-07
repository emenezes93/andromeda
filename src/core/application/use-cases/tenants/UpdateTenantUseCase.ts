import type { IAuditService } from '@ports/services/IAuditService.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface UpdateTenantRequest {
  tenantId: string;
  actorUserId: string;
  actorTenantId: string;
  name?: string;
  status?: 'active' | 'suspended';
  emailAlertsEnabled?: boolean;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export interface UpdateTenantResponse {
  id: string;
  name: string;
  status: string;
  emailAlertsEnabled: boolean;
  logoUrl: string | null;
  brandColor: string | null;
  createdAt: Date;
}

/**
 * Use case: Update tenant (owner only, global access).
 */
export class UpdateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: UpdateTenantRequest): Promise<UpdateTenantResponse> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant || tenant.isDeleted()) throw new NotFoundError('Tenant not found');

    const updated = await this.tenantRepository.update(request.tenantId, {
      name: request.name,
      status: request.status,
      emailAlertsEnabled: request.emailAlertsEnabled,
      logoUrl: request.logoUrl,
      brandColor: request.brandColor,
    });

    await this.auditService.log(
      request.actorTenantId,
      'update',
      'tenant',
      updated.id,
      request.actorUserId,
      {
        name: updated.name,
        status: updated.status,
        emailAlertsEnabled: updated.emailAlertsEnabled,
        logoUrl: updated.logoUrl,
        brandColor: updated.brandColor,
      }
    );

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      emailAlertsEnabled: updated.emailAlertsEnabled,
      logoUrl: updated.logoUrl,
      brandColor: updated.brandColor,
      createdAt: updated.createdAt,
    };
  }
}
