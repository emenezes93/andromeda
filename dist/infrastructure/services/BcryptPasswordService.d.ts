import type { IPasswordService } from '../../ports/services/IPasswordService.js';
/**
 * Adapter: Bcrypt Password Service Implementation
 */
export declare class BcryptPasswordService implements IPasswordService {
    private readonly saltRounds;
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
}
//# sourceMappingURL=BcryptPasswordService.d.ts.map