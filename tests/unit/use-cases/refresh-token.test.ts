import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase.js';
import { User } from '@domain/entities/User.js';
import { Membership } from '@domain/entities/Membership.js';
import { Tenant } from '@domain/entities/Tenant.js';
import { RefreshToken } from '@domain/entities/RefreshToken.js';
import { AuthToken } from '@domain/entities/AuthToken.js';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/AppError.js';

const future = new Date(Date.now() + 7 * 86400_000);

const makeStoredToken = (overrides: { expiresAt?: Date; revokedAt?: Date | null } = {}) =>
  new RefreshToken(
    'rt-1', 'user-1', 'tenant-1', 'old-token-value',
    overrides.expiresAt ?? future,
    overrides.revokedAt !== undefined ? overrides.revokedAt : null,
    new Date(),
  );

const makeUser = (deleted = false) =>
  new User('user-1', 'a@b.com', 'h', 'Alice', new Date(), deleted ? new Date() : null, 0, null);

const makeMembership = () =>
  new Membership('mb-1', 'user-1', 'tenant-1', 'practitioner', true, new Date());

const makeTenant = (active = true) =>
  new Tenant('tenant-1', 'Clinic', active ? 'active' : 'suspended', new Date(), null, 'free');

const makeAuthToken = () =>
  new AuthToken('new-jwt', 900, 'user-1', 'a@b.com', 'practitioner', 'tenant-1');

const makeRefreshTokenRepo = () => ({
  findByToken: vi.fn(), create: vi.fn(), revoke: vi.fn(),
  revokeByToken: vi.fn(), revokeAllForUserInTenant: vi.fn(), deleteExpired: vi.fn(),
});
const makeUserRepo = () => ({
  findByEmail: vi.fn(), findById: vi.fn(), exists: vi.fn(),
  createWithMembership: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
  findAll: vi.fn(), findByIdInTenant: vi.fn(),
  recordFailedLogin: vi.fn(), recordSuccessfulLogin: vi.fn(),
});
const makeMembershipRepo = () => ({
  findByUserId: vi.fn(), findByUserIdAndTenantId: vi.fn(),
  findAllByTenantId: vi.fn(), create: vi.fn(), updateRole: vi.fn(),
  setActive: vi.fn(), deleteByUserIdAndTenantId: vi.fn(),
});
const makeTenantRepo = () => ({
  findById: vi.fn(), findAll: vi.fn(), create: vi.fn(), update: vi.fn(),
  suspend: vi.fn(), activate: vi.fn(), existsByName: vi.fn(),
});
const makeTokenService = () => ({
  generateAccessToken: vi.fn(), generateRefreshToken: vi.fn(),
  calculateRefreshTokenExpiry: vi.fn(),
});

describe('RefreshTokenUseCase', () => {
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;
  let membershipRepo: ReturnType<typeof makeMembershipRepo>;
  let tenantRepo: ReturnType<typeof makeTenantRepo>;
  let tokenSvc: ReturnType<typeof makeTokenService>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    refreshTokenRepo = makeRefreshTokenRepo();
    userRepo = makeUserRepo();
    membershipRepo = makeMembershipRepo();
    tenantRepo = makeTenantRepo();
    tokenSvc = makeTokenService();

    useCase = new RefreshTokenUseCase(
      refreshTokenRepo as any, userRepo as any, membershipRepo as any,
      tenantRepo as any, tokenSvc as any,
    );

    refreshTokenRepo.findByToken.mockResolvedValue(makeStoredToken());
    membershipRepo.findByUserIdAndTenantId.mockResolvedValue(makeMembership());
    tenantRepo.findById.mockResolvedValue(makeTenant());
    userRepo.findById.mockResolvedValue(makeUser());
    tokenSvc.generateAccessToken.mockResolvedValue(makeAuthToken());
    tokenSvc.generateRefreshToken.mockResolvedValue('new-rt-uuid');
    tokenSvc.calculateRefreshTokenExpiry.mockReturnValue(future);
    refreshTokenRepo.revoke.mockResolvedValue(undefined);
    refreshTokenRepo.create.mockImplementation(async (t) => t);
  });

  it('returns new token pair on success', async () => {
    const result = await useCase.execute({ refreshToken: 'old-token-value' });
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws UnauthorizedError when token is not found', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(null);
    await expect(
      useCase.execute({ refreshToken: 'missing' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when token is expired', async () => {
    const past = new Date(Date.now() - 1000);
    refreshTokenRepo.findByToken.mockResolvedValue(makeStoredToken({ expiresAt: past }));
    await expect(
      useCase.execute({ refreshToken: 'old-token-value' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when token is revoked', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(
      makeStoredToken({ revokedAt: new Date() })
    );
    await expect(
      useCase.execute({ refreshToken: 'old-token-value' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when membership no longer exists', async () => {
    membershipRepo.findByUserIdAndTenantId.mockResolvedValue(null);
    await expect(
      useCase.execute({ refreshToken: 'old-token-value' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws ForbiddenError when tenant is not active', async () => {
    tenantRepo.findById.mockResolvedValue(makeTenant(false));
    await expect(
      useCase.execute({ refreshToken: 'old-token-value' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError when tenant is not found', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ refreshToken: 'old-token-value' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws UnauthorizedError when user is deleted', async () => {
    userRepo.findById.mockResolvedValue(makeUser(true));
    await expect(
      useCase.execute({ refreshToken: 'old-token-value' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('revokes the old refresh token', async () => {
    await useCase.execute({ refreshToken: 'old-token-value' });
    expect(refreshTokenRepo.revoke).toHaveBeenCalledTimes(1);
  });

  it('creates a new refresh token in the repository', async () => {
    await useCase.execute({ refreshToken: 'old-token-value' });
    expect(refreshTokenRepo.create).toHaveBeenCalledTimes(1);
  });

  it('new refresh token has a different value than the old one', async () => {
    const result = await useCase.execute({ refreshToken: 'old-token-value' });
    expect(result.refreshToken.token).toBe('new-rt-uuid');
    expect(result.refreshToken.token).not.toBe('old-token-value');
  });
});
