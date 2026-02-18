import bcrypt from 'bcrypt';
import type { IPasswordService } from '@ports/services/IPasswordService.js';

/**
 * Adapter: Bcrypt Password Service Implementation
 */
export class BcryptPasswordService implements IPasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
