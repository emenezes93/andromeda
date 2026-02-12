import { BadRequestError } from '../../../shared/errors.js';
/**
 * Use Case: Register User
 * Business logic for user registration
 */
export class RegisterUseCase {
    userRepository;
    membershipRepository;
    passwordService;
    constructor(userRepository, membershipRepository, passwordService) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.passwordService = passwordService;
    }
    async execute(request) {
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
//# sourceMappingURL=RegisterUseCase.js.map