import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUseCase } from '@application/use-cases/auth/RegisterUseCase.js';
import { User } from '@domain/entities/User.js';
import { BadRequestError } from '@shared/errors/AppError.js';

const makeCreatedUser = () =>
  new User('user-new', 'new@example.com', '$2b$12$hash', 'New User', new Date(), null, 0, null);

const makeUserRepo = () => ({
  findByEmail: vi.fn(), findById: vi.fn(), exists: vi.fn(),
  createWithMembership: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
  findAll: vi.fn(), findByIdInTenant: vi.fn(),
  recordFailedLogin: vi.fn(), recordSuccessfulLogin: vi.fn(),
});

const makePasswordService = () => ({ hash: vi.fn(), compare: vi.fn() });

describe('RegisterUseCase', () => {
  let userRepo: ReturnType<typeof makeUserRepo>;
  let passwordSvc: ReturnType<typeof makePasswordService>;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepo = makeUserRepo();
    passwordSvc = makePasswordService();
    useCase = new RegisterUseCase(userRepo as any, passwordSvc as any);

    userRepo.exists.mockResolvedValue(false);
    passwordSvc.hash.mockResolvedValue('$2b$12$hashed');
    userRepo.createWithMembership.mockResolvedValue(makeCreatedUser());
  });

  it('returns id, email and name on success', async () => {
    const result = await useCase.execute({
      email: 'new@example.com',
      password: 'secret123',
      name: 'New User',
      tenantId: 'tenant-1',
    });

    expect(result.id).toBe('user-new');
    expect(result.email).toBe('new@example.com');
    expect(result.name).toBe('New User');
  });

  it('throws BadRequestError when email is already registered', async () => {
    userRepo.exists.mockResolvedValue(true);
    await expect(
      useCase.execute({ email: 'existing@x.com', password: 'pass', tenantId: 't1' })
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('checks email existence before creating user', async () => {
    userRepo.exists.mockResolvedValue(false);
    await useCase.execute({ email: 'new@x.com', password: 'pass', tenantId: 't1' });
    expect(userRepo.exists).toHaveBeenCalledWith('new@x.com');
  });

  it('hashes the password before creating the user', async () => {
    await useCase.execute({ email: 'new@x.com', password: 'mypassword', tenantId: 't1' });
    expect(passwordSvc.hash).toHaveBeenCalledWith('mypassword');
    expect(userRepo.createWithMembership).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: '$2b$12$hashed' })
    );
  });

  it('defaults role to "practitioner" when not specified', async () => {
    await useCase.execute({ email: 'new@x.com', password: 'pass', tenantId: 't1' });
    expect(userRepo.createWithMembership).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'practitioner' })
    );
  });

  it('uses the provided defaultRole when specified', async () => {
    await useCase.execute({
      email: 'new@x.com', password: 'pass', tenantId: 't1', defaultRole: 'admin',
    });
    expect(userRepo.createWithMembership).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' })
    );
  });

  it('passes tenantId to createWithMembership', async () => {
    await useCase.execute({ email: 'new@x.com', password: 'pass', tenantId: 'my-tenant' });
    expect(userRepo.createWithMembership).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'my-tenant' })
    );
  });

  it('sets name to null when not provided', async () => {
    await useCase.execute({ email: 'new@x.com', password: 'pass', tenantId: 't1' });
    expect(userRepo.createWithMembership).toHaveBeenCalledWith(
      expect.objectContaining({ name: null })
    );
  });

  it('does not call createWithMembership when email already exists', async () => {
    userRepo.exists.mockResolvedValue(true);
    await expect(
      useCase.execute({ email: 'old@x.com', password: 'pass', tenantId: 't1' })
    ).rejects.toThrow();
    expect(userRepo.createWithMembership).not.toHaveBeenCalled();
  });
});
