import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { IPasswordService } from '@ports/services/IPasswordService.js';
import { BadRequestError } from '@shared/errors/index.js';

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string | null;
  tenantId: string;
  defaultRole?: 'practitioner' | 'admin';
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Use Case: Register User
 * Creates a new user and their tenant membership atomically via createWithMembership.
 */
export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService
  ) {}

  async execute(request: RegisterRequest): Promise<RegisterResponse> {
    const exists = await this.userRepository.exists(request.email);
    if (exists) {
      throw new BadRequestError('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(request.password);
    const role = request.defaultRole ?? 'practitioner';

    // createWithMembership wraps user + membership creation in a single $transaction
    const createdUser = await this.userRepository.createWithMembership({
      email: request.email,
      passwordHash,
      name: request.name ?? null,
      tenantId: request.tenantId,
      role,
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    };
  }
}
