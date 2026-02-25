import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import bcrypt from 'bcrypt';
import { BcryptPasswordService } from '@infrastructure/services/BcryptPasswordService.js';

describe('BcryptPasswordService', () => {
  let svc: BcryptPasswordService;

  beforeEach(() => {
    svc = new BcryptPasswordService();
    vi.clearAllMocks();
  });

  describe('hash()', () => {
    it('calls bcrypt.hash with the password', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('$2b$12$hashedvalue' as never);
      await svc.hash('my-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('my-password', expect.any(Number));
    });

    it('returns the hash produced by bcrypt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('$2b$12$hashed' as never);
      const result = await svc.hash('pass');
      expect(result).toBe('$2b$12$hashed');
    });

    it('uses saltRounds = 12', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never);
      await svc.hash('pass');
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 12);
    });
  });

  describe('compare()', () => {
    it('calls bcrypt.compare with password and hash', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      await svc.compare('password', '$2b$12$hash');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', '$2b$12$hash');
    });

    it('returns true when bcrypt.compare returns true', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      expect(await svc.compare('correct', 'hash')).toBe(true);
    });

    it('returns false when bcrypt.compare returns false', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      expect(await svc.compare('wrong', 'hash')).toBe(false);
    });
  });
});
