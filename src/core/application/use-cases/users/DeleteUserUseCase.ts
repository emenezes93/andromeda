import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/index.js';

export interface DeleteUserRequest {
  userId: string;
  tenantId: string;
  actorUserId: string;
}

export class DeleteUserUseCase {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: DeleteUserRequest): Promise<void> {
    if (request.actorUserId === request.userId) {
      throw new ForbiddenError('Cannot remove yourself from the tenant');
    }
    const membership = await this.membershipRepository.findByUserIdAndTenantId(
      request.userId,
      request.tenantId
    );
    if (!membership) throw new NotFoundError('User not found');
    if (membership.role === 'owner') {
      throw new ForbiddenError('Cannot remove an owner from the tenant');
    }
    await this.membershipRepository.deleteByUserIdAndTenantId(request.userId, request.tenantId);
    await this.auditService.log(
      request.tenantId,
      'remove_from_tenant',
      'user',
      request.userId,
      request.actorUserId,
      {}
    );
  }
}
