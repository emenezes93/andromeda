import { Membership } from '@domain/entities/Membership.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { IPasswordService } from '@ports/services/IPasswordService.js';
import { BadRequestError } from '@shared/errors/index.js';

export interface CreateUserRequest {
  tenantId: string;
  actorUserId: string;
  email: string;
  password: string;
  name?: string | null;
  role: 'admin' | 'practitioner' | 'viewer';
}

export interface CreateUserResponse {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Use case: Create a user in the tenant (admin+). Creates user and membership; audits.
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    const existing = await this.userRepository.findByEmail(request.email);
    let user;
    if (existing) {
      const inTenant = await this.membershipRepository.findByUserIdAndTenantId(
        existing.id,
        request.tenantId
      );
      if (inTenant) throw new BadRequestError('User already in tenant');
      const membership = Membership.create(
        existing.id,
        request.tenantId,
        request.role as 'admin' | 'practitioner' | 'viewer',
        true
      );
      await this.membershipRepository.create(membership);
      user = existing;
    } else {
      const passwordHash = await this.passwordService.hash(request.password);
      user = await this.userRepository.createWithMembership({
        email: request.email,
        passwordHash,
        name: request.name ?? null,
        tenantId: request.tenantId,
        role: request.role,
      });
    }

    await this.auditService.log(
      request.tenantId,
      'create',
      'user',
      user.id,
      request.actorUserId,
      { email: user.email, role: request.role }
    );

    return { id: user.id, email: user.email, name: user.name };
  }
}
