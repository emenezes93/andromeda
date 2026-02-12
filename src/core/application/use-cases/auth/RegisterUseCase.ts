import { User } from '@domain/entities/User.js';
import { Membership } from '@domain/entities/Membership.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
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
 * Business logic for user registration
 */
export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly passwordService: IPasswordService
  ) {}

  async execute(request: RegisterRequest): Promise<RegisterResponse> {
    // Check if email already exists
    const exists = await this.userRepository.exists(request.email);
    if (exists) {
      throw new BadRequestError('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(request.password);

    // Create user entity
    const user = User.create(request.email, passwordHash, request.name ?? null);
    const createdUser = await this.userRepository.create(user);

    // Create membership
    const role = request.defaultRole ?? 'practitioner';
    const membership = Membership.create(createdUser.id, request.tenantId, role);
    await this.membershipRepository.create(membership);

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    };
  }
}
