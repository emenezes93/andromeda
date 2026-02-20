import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/index.js';

export interface UpdateRoleRequest {
  userId: string;
  tenantId: string;
  actorUserId: string;
  role: 'admin' | 'practitioner' | 'viewer';
}

export interface UpdateRoleResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

export class UpdateRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: UpdateRoleRequest): Promise<UpdateRoleResponse> {
    if (request.actorUserId === request.userId) {
      throw new ForbiddenError('Cannot change your own role');
    }
    const membership = await this.membershipRepository.findByUserIdAndTenantId(
      request.userId,
      request.tenantId
    );
    if (!membership) throw new NotFoundError('User not found');
    if (membership.role === 'owner') {
      throw new ForbiddenError('Cannot change the role of an owner');
    }
    const updated = await this.membershipRepository.updateRole(membership.id, request.role);
    const user = await this.userRepository.findById(request.userId);
    if (!user) throw new NotFoundError('User not found');
    await this.auditService.log(
      request.tenantId,
      'update_role',
      'user',
      request.userId,
      request.actorUserId,
      { role: request.role }
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
