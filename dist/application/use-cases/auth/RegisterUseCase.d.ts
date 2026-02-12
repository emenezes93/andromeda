import type { IUserRepository } from '../../../ports/repositories/IUserRepository.js';
import type { IMembershipRepository } from '../../../ports/repositories/IMembershipRepository.js';
import type { IPasswordService } from '../../../ports/services/IPasswordService.js';
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
export declare class RegisterUseCase {
    private readonly userRepository;
    private readonly membershipRepository;
    private readonly passwordService;
    constructor(userRepository: IUserRepository, membershipRepository: IMembershipRepository, passwordService: IPasswordService);
    execute(request: RegisterRequest): Promise<RegisterResponse>;
}
//# sourceMappingURL=RegisterUseCase.d.ts.map