import { describe, it, expect } from 'vitest';
import { User } from '@domain/entities/User.js';

const makeUser = (overrides: Partial<{
  deletedAt: Date | null;
  loginAttempts: number;
  lockedUntil: Date | null;
}> = {}) =>
  new User(
    'user-1',
    'user@example.com',
    '$2b$12$hashed',
    'João Silva',
    new Date('2023-01-01'),
    overrides.deletedAt ?? null,
    overrides.loginAttempts ?? 0,
    overrides.lockedUntil ?? null,
  );

describe('User entity', () => {
  describe('User.create()', () => {
    it('sets email and passwordHash', () => {
      const user = User.create('a@b.com', 'hash123');
      expect(user.email).toBe('a@b.com');
      expect(user.passwordHash).toBe('hash123');
    });

    it('sets name to null by default', () => {
      const user = User.create('a@b.com', 'hash');
      expect(user.name).toBeNull();
    });

    it('accepts an explicit name', () => {
      const user = User.create('a@b.com', 'hash', 'Maria');
      expect(user.name).toBe('Maria');
    });

    it('generates empty id (persistence assigns real id)', () => {
      const user = User.create('a@b.com', 'hash');
      expect(user.id).toBe('');
    });

    it('sets loginAttempts to 0', () => {
      const user = User.create('a@b.com', 'hash');
      expect(user.loginAttempts).toBe(0);
    });

    it('sets lockedUntil to null', () => {
      const user = User.create('a@b.com', 'hash');
      expect(user.lockedUntil).toBeNull();
    });

    it('sets createdAt to current time', () => {
      const before = new Date();
      const user = User.create('a@b.com', 'hash');
      const after = new Date();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      expect(makeUser().isDeleted()).toBe(false);
    });

    it('returns true when deletedAt is set', () => {
      expect(makeUser({ deletedAt: new Date() }).isDeleted()).toBe(true);
    });
  });

  describe('isLocked()', () => {
    it('returns false when lockedUntil is null', () => {
      expect(makeUser().isLocked()).toBe(false);
    });

    it('returns false when lockedUntil is in the past', () => {
      const past = new Date(Date.now() - 60_000);
      expect(makeUser({ lockedUntil: past }).isLocked()).toBe(false);
    });

    it('returns true when lockedUntil is in the future', () => {
      const future = new Date(Date.now() + 60_000);
      expect(makeUser({ lockedUntil: future }).isLocked()).toBe(true);
    });
  });
});
