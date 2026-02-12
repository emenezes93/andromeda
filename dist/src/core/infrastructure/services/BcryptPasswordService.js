import bcrypt from 'bcrypt';
/**
 * Adapter: Bcrypt Password Service Implementation
 */
export class BcryptPasswordService {
    saltRounds = 12;
    async hash(password) {
        return bcrypt.hash(password, this.saltRounds);
    }
    async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
}
//# sourceMappingURL=BcryptPasswordService.js.map