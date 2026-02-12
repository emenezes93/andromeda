import { describe, it, expect } from 'vitest';
import { hasMinimumRole, requireRole, requireOneOfRoles, Guards } from '@shared/utils/rbac.js';
import { ForbiddenError } from '@shared/errors/index.js';

describe('hasMinimumRole', () => {
  it('owner has all roles', () => {
    expect(hasMinimumRole('owner', 'viewer')).toBe(true);
    expect(hasMinimumRole('owner', 'admin')).toBe(true);
  });

  it('viewer does not have admin', () => {
    expect(hasMinimumRole('viewer', 'admin')).toBe(false);
  });

  it('practitioner has practitioner and viewer', () => {
    expect(hasMinimumRole('practitioner', 'practitioner')).toBe(true);
    expect(hasMinimumRole('practitioner', 'viewer')).toBe(true);
    expect(hasMinimumRole('practitioner', 'admin')).toBe(false);
  });
});

describe('requireRole', () => {
  it('throws when user role is below required', () => {
    expect(() => requireRole('viewer', 'admin')).toThrow(ForbiddenError);
  });

  it('throws when user role is undefined', () => {
    expect(() => requireRole(undefined, 'viewer')).toThrow(ForbiddenError);
  });

  it('does not throw when role is sufficient', () => {
    expect(() => requireRole('admin', 'viewer')).not.toThrow();
  });
});

describe('requireOneOfRoles', () => {
  it('allows owner for tenants guard', () => {
    expect(() => Guards.tenants('owner')).not.toThrow();
  });

  it('rejects viewer for tenants guard', () => {
    expect(() => Guards.tenants('viewer')).toThrow(ForbiddenError);
  });

  it('allows practitioner for templates guard', () => {
    expect(() => Guards.templates('practitioner')).not.toThrow();
  });

  it('allows viewer for readOnly', () => {
    expect(() => Guards.readOnly('viewer')).not.toThrow();
  });
});
