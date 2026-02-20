import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import type { IRefreshTokenRepository } from '@ports/repositories/IRefreshTokenRepository.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/index.js';

export interface SetActiveRequest {
  userId: string;
  tenantId: string;
  actorUserId: string;
  active: boolean;
}

export interface SetActiveResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

/**
 * Use case: Activate or deactivate user in tenant. Cannot change self or owner.
 */
export class SetActiveUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: SetActiveRequest): Promise<SetActiveResponse> {
    if (request.actorUserId === request.userId) {
      throw new ForbiddenError('Cannot activate/deactivate yourself');
    }

    const membership = await this.membershipRepository.findByUserIdAndTenantId(
      request.userId,
      request.tenantId
    );
    if (!membership) throw new NotFoundError('User not found');
    if (membership.role === 'owner') {
      throw new ForbiddenError('Cannot activate/deactivate an owner');
    }

    const updated = await this.membershipRepository.setActive(membership.id, request.active);
    if (!request.active) {
      await this.refreshTokenRepository.revokeAllForUserInTenant(request.userId, request.tenantId);
    }
    const user = await this.userRepository.findById(request.userId);
    if (!user) throw new NotFoundError('User not found');

    await this.auditService.log(
      request.tenantId,
      request.active ? 'activate_user' : 'deactivate_user',
      'user',
      request.userId,
      request.actorUserId,
      {}
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: updated.role,
      active: updated.active,
    };
  }
}
