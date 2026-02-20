import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetUserRequest {
  userId: string;
  tenantId: string;
}

export interface GetUserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

export class GetUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository
  ) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    const membership = await this.membershipRepository.findByUserIdAndTenantId(
      request.userId,
      request.tenantId
    );
    if (!membership) throw new NotFoundError('User not found');
    const user = await this.userRepository.findById(request.userId);
    if (!user || user.isDeleted()) throw new NotFoundError('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: membership.role,
      active: membership.active,
    };
  }
}
