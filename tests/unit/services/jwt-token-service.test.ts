import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { JwtTokenService } from '@infrastructure/services/JwtTokenService.js';
import { User } from '@domain/entities/User.js';
import { Membership } from '@domain/entities/Membership.js';

const SECRET = 'test-secret-key-min-32-chars-xxxx';

const makeUser = () =>
  new User('user-1', 'alice@example.com', 'hash', 'Alice', new Date(), null, 0, null);

const makeMembership = () =>
  new Membership('mb-1', 'user-1', 'tenant-1', 'admin', true, new Date());

describe('JwtTokenService', () => {
  describe('constructor', () => {
    it('throws when secret is shorter than 32 characters', () => {
      expect(() => new JwtTokenService('short')).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('throws for empty secret', () => {
      expect(() => new JwtTokenService('')).toThrow();
    });

    it('does not throw for a valid 32-char secret', () => {
      expect(() => new JwtTokenService(SECRET)).not.toThrow();
    });
  });

  describe('generateAccessToken()', () => {
    it('returns an AuthToken with correct metadata', async () => {
      const svc = new JwtTokenService(SECRET);
      const token = await svc.generateAccessToken(makeUser(), makeMembership());

      expect(token.userId).toBe('user-1');
      expect(token.email).toBe('alice@example.com');
      expect(token.role).toBe('admin');
      expect(token.tenantId).toBe('tenant-1');
      expect(token.expiresIn).toBe(900); // 15 minutes in seconds
    });

    it('returns a verifiable JWT string', async () => {
      const svc = new JwtTokenService(SECRET);
      const authToken = await svc.generateAccessToken(makeUser(), makeMembership());

      const decoded = jwt.verify(authToken.token, SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe('user-1');
      expect(decoded.email).toBe('alice@example.com');
      expect(decoded.role).toBe('admin');
      expect(decoded.tenantId).toBe('tenant-1');
    });

    it('JWT is not verifiable with a different secret', async () => {
      const svc = new JwtTokenService(SECRET);
      const authToken = await svc.generateAccessToken(makeUser(), makeMembership());

      expect(() =>
        jwt.verify(authToken.token, 'wrong-secret-that-is-at-least-32-chars!!')
      ).toThrow();
    });

    it('generates different tokens for different users', async () => {
      const svc = new JwtTokenService(SECRET);
      const u1 = new User('u1', 'a@b.com', 'h', null, new Date(), null, 0, null);
      const u2 = new User('u2', 'c@d.com', 'h', null, new Date(), null, 0, null);
      const m = makeMembership();

      const t1 = await svc.generateAccessToken(u1, m);
      const t2 = await svc.generateAccessToken(u2, m);
      expect(t1.token).not.toBe(t2.token);
    });
  });

  describe('generateRefreshToken()', () => {
    it('returns a non-empty string', async () => {
      const svc = new JwtTokenService(SECRET);
      const token = await svc.generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('returns a UUID-like string', async () => {
      const svc = new JwtTokenService(SECRET);
      const token = await svc.generateRefreshToken();
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('generates unique tokens on each call', async () => {
      const svc = new JwtTokenService(SECRET);
      const t1 = await svc.generateRefreshToken();
      const t2 = await svc.generateRefreshToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe('calculateRefreshTokenExpiry()', () => {
    it('returns a Date approximately 30 days in the future', () => {
      const svc = new JwtTokenService(SECRET);
      const expiry = svc.calculateRefreshTokenExpiry();
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);

      expect(days).toBeGreaterThan(29.9);
      expect(days).toBeLessThan(30.1);
    });

    it('returns a Date in the future', () => {
      const svc = new JwtTokenService(SECRET);
      expect(svc.calculateRefreshTokenExpiry().getTime()).toBeGreaterThan(Date.now());
    });
  });
});
