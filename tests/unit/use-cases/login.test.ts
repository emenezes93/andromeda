import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase.js';
import { User } from '@domain/entities/User.js';
import { Membership } from '@domain/entities/Membership.js';
import { Tenant } from '@domain/entities/Tenant.js';
import { AuthToken } from '@domain/entities/AuthToken.js';
import { RefreshToken } from '@domain/entities/RefreshToken.js';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/AppError.js';

// ── Factories ──────────────────────────────────────────────────────────────
const makeUser = (overrides: Partial<{
  deletedAt: Date | null;
  lockedUntil: Date | null;
}> = {}) =>
  new User(
    'user-1', 'alice@example.com', '$2b$12$hash',
    'Alice', new Date(),
    overrides.deletedAt ?? null, 0,
    overrides.lockedUntil ?? null,
  );

const makeMembership = () =>
  new Membership('mb-1', 'user-1', 'tenant-1', 'admin', true, new Date());

const makeTenant = (active = true) =>
  new Tenant('tenant-1', 'Clinic', active ? 'active' : 'suspended', new Date(), null, 'free');

const makeAuthToken = () =>
  new AuthToken('jwt-token', 900, 'user-1', 'alice@example.com', 'admin', 'tenant-1');

const makeRefreshToken = () =>
  RefreshToken.create('user-1', 'tenant-1', 'rt-uuid', new Date(Date.now() + 86400_000));

// ── Mock repos/services ────────────────────────────────────────────────────
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
const makeRefreshTokenRepo = () => ({
  findByToken: vi.fn(), create: vi.fn(), revoke: vi.fn(),
  revokeByToken: vi.fn(), revokeAllForUserInTenant: vi.fn(), deleteExpired: vi.fn(),
});
const makePasswordService = () => ({ hash: vi.fn(), compare: vi.fn() });
const makeTokenService = () => ({
  generateAccessToken: vi.fn(), generateRefreshToken: vi.fn(),
  calculateRefreshTokenExpiry: vi.fn(),
});
const makeAuditService = () => ({ log: vi.fn() });

describe('LoginUseCase', () => {
  let userRepo: ReturnType<typeof makeUserRepo>;
  let membershipRepo: ReturnType<typeof makeMembershipRepo>;
  let tenantRepo: ReturnType<typeof makeTenantRepo>;
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepo>;
  let passwordSvc: ReturnType<typeof makePasswordService>;
  let tokenSvc: ReturnType<typeof makeTokenService>;
  let auditSvc: ReturnType<typeof makeAuditService>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    membershipRepo = makeMembershipRepo();
    tenantRepo = makeTenantRepo();
    refreshTokenRepo = makeRefreshTokenRepo();
    passwordSvc = makePasswordService();
    tokenSvc = makeTokenService();
    auditSvc = makeAuditService();

    useCase = new LoginUseCase(
      userRepo as any, membershipRepo as any, tenantRepo as any,
      refreshTokenRepo as any, passwordSvc as any, tokenSvc as any, auditSvc as any,
    );

    // Happy-path defaults
    userRepo.findByEmail.mockResolvedValue(makeUser());
    userRepo.recordSuccessfulLogin.mockResolvedValue(undefined);
    userRepo.recordFailedLogin.mockResolvedValue(undefined);
    membershipRepo.findByUserId.mockResolvedValue(makeMembership());
    tenantRepo.findById.mockResolvedValue(makeTenant());
    passwordSvc.compare.mockResolvedValue(true);
    tokenSvc.generateAccessToken.mockResolvedValue(makeAuthToken());
    tokenSvc.generateRefreshToken.mockResolvedValue('rt-uuid');
    tokenSvc.calculateRefreshTokenExpiry.mockReturnValue(new Date(Date.now() + 86400_000));
    refreshTokenRepo.create.mockResolvedValue(makeRefreshToken());
    auditSvc.log.mockResolvedValue(undefined);
  });

  it('returns token, refreshToken and user on successful login', async () => {
    const result = await useCase.execute({ email: 'alice@example.com', password: 'pass' });

    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('alice@example.com');
    expect(result.user.role).toBe('admin');
    expect(result.user.tenantId).toBe('tenant-1');
  });

  it('throws UnauthorizedError when user is not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(
      useCase.execute({ email: 'nobody@x.com', password: 'pass' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when user is soft-deleted', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser({ deletedAt: new Date() }));
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'pass' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws ForbiddenError when user account is locked', async () => {
    userRepo.findByEmail.mockResolvedValue(
      makeUser({ lockedUntil: new Date(Date.now() + 60_000) })
    );
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'pass' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws UnauthorizedError and records failed login when password is wrong', async () => {
    passwordSvc.compare.mockResolvedValue(false);
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'wrong' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(userRepo.recordFailedLogin).toHaveBeenCalledWith('user-1');
  });

  it('does not record failed login when user is not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(
      useCase.execute({ email: 'x@x.com', password: 'p' })
    ).rejects.toThrow();
    expect(userRepo.recordFailedLogin).not.toHaveBeenCalled();
  });

  it('records successful login on correct password', async () => {
    await useCase.execute({ email: 'alice@example.com', password: 'pass' });
    expect(userRepo.recordSuccessfulLogin).toHaveBeenCalledWith('user-1');
  });

  it('throws UnauthorizedError when user has no membership', async () => {
    membershipRepo.findByUserId.mockResolvedValue(null);
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'pass' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws ForbiddenError when tenant is suspended', async () => {
    tenantRepo.findById.mockResolvedValue(makeTenant(false));
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'pass' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError when tenant is not found', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'pass' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('creates refresh token in repository', async () => {
    await useCase.execute({ email: 'alice@example.com', password: 'pass' });
    expect(refreshTokenRepo.create).toHaveBeenCalledTimes(1);
  });

  it('calls auditService.log with "login" action', async () => {
    await useCase.execute({ email: 'alice@example.com', password: 'pass' });
    expect(auditSvc.log).toHaveBeenCalledWith(
      'tenant-1', 'login', 'user', 'user-1', 'user-1',
      expect.objectContaining({ email: 'alice@example.com' }),
    );
  });
});
