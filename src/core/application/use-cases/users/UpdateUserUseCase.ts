import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { IPasswordService } from '@ports/services/IPasswordService.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface UpdateUserRequest {
  userId: string;
  tenantId: string;
  actorUserId: string;
  name?: string | null;
  email?: string;
  password?: string;
}

export interface UpdateUserResponse {
  id: string;
  email: string;
  name: string | null;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    const user = await this.userRepository.findByIdInTenant(request.userId, request.tenantId);
    if (!user) throw new NotFoundError('User not found');
    const updates: { name?: string; email?: string; passwordHash?: string } = {};
    if (request.name !== undefined) updates.name = request.name ?? undefined;
    if (request.email !== undefined) updates.email = request.email;
    if (request.password) {
      updates.passwordHash = await this.passwordService.hash(request.password);
    }
    const updated = await this.userRepository.update(request.userId, request.tenantId, updates);
    await this.auditService.log(
      request.tenantId,
      'update',
      'user',
      updated.id,
      request.actorUserId,
      {}
    );
    return { id: updated.id, email: updated.email, name: updated.name };
  }
}
