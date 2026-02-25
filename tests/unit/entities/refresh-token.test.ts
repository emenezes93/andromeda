import { describe, it, expect } from 'vitest';
import { RefreshToken } from '@domain/entities/RefreshToken.js';

const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days
const past = new Date(Date.now() - 1000); // 1 second ago

const makeToken = (overrides: { expiresAt?: Date; revokedAt?: Date | null } = {}) =>
  new RefreshToken(
    'rt-1',
    'user-1',
    'tenant-1',
    'random-uuid-token',
    overrides.expiresAt ?? future,
    overrides.revokedAt !== undefined ? overrides.revokedAt : null,
    new Date(),
  );

describe('RefreshToken entity', () => {
  describe('RefreshToken.create()', () => {
    it('sets all fields correctly', () => {
      const token = RefreshToken.create('u1', 't1', 'my-token', future);
      expect(token.userId).toBe('u1');
      expect(token.tenantId).toBe('t1');
      expect(token.token).toBe('my-token');
      expect(token.expiresAt).toBe(future);
      expect(token.revokedAt).toBeNull();
      expect(token.id).toBe('');
    });
  });

  describe('isExpired()', () => {
    it('returns false when expiresAt is in the future', () => {
      expect(makeToken({ expiresAt: future }).isExpired()).toBe(false);
    });

    it('returns true when expiresAt is in the past', () => {
      expect(makeToken({ expiresAt: past }).isExpired()).toBe(true);
    });
  });

  describe('isRevoked()', () => {
    it('returns false when revokedAt is null', () => {
      expect(makeToken().isRevoked()).toBe(false);
    });

    it('returns true when revokedAt is set', () => {
      expect(makeToken({ revokedAt: new Date() }).isRevoked()).toBe(true);
    });
  });

  describe('isValid()', () => {
    it('returns true for a non-expired, non-revoked token', () => {
      expect(makeToken().isValid()).toBe(true);
    });

    it('returns false for an expired token', () => {
      expect(makeToken({ expiresAt: past }).isValid()).toBe(false);
    });

    it('returns false for a revoked token', () => {
      expect(makeToken({ revokedAt: new Date() }).isValid()).toBe(false);
    });

    it('returns false for expired AND revoked token', () => {
      expect(makeToken({ expiresAt: past, revokedAt: new Date() }).isValid()).toBe(false);
    });
  });

  describe('revoke()', () => {
    it('returns a new token with revokedAt set', () => {
      const original = makeToken();
      const revoked = original.revoke();
      expect(revoked.revokedAt).not.toBeNull();
      expect(revoked.revokedAt).toBeInstanceOf(Date);
    });

    it('does not mutate the original token', () => {
      const original = makeToken();
      original.revoke();
      expect(original.revokedAt).toBeNull();
    });

    it('preserves all other fields', () => {
      const original = makeToken();
      const revoked = original.revoke();
      expect(revoked.id).toBe(original.id);
      expect(revoked.userId).toBe(original.userId);
      expect(revoked.tenantId).toBe(original.tenantId);
      expect(revoked.token).toBe(original.token);
      expect(revoked.expiresAt).toBe(original.expiresAt);
    });

    it('revoked token isValid() returns false', () => {
      expect(makeToken().revoke().isValid()).toBe(false);
    });
  });
});
