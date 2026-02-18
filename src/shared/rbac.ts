import type { Role } from './types.js';
import { ForbiddenError } from './errors.js';

const hierarchy: Record<Role, number> = {
  owner: 4,
  admin: 3,
  practitioner: 2,
  viewer: 1,
};

export function hasMinimumRole(userRole: Role, required: Role): boolean {
  return hierarchy[userRole] >= hierarchy[required];
}

export function requireRole(userRole: Role | undefined, required: Role): void {
  if (!userRole) throw new ForbiddenError('Authentication required');
  if (!hasMinimumRole(userRole, required)) {
    throw new ForbiddenError(`Insufficient role. Required: ${required}`);
  }
}

export function requireOneOfRoles(userRole: Role | undefined, allowed: Role[]): void {
  if (!userRole) throw new ForbiddenError('Authentication required');
  const ok = allowed.some((r) => hasMinimumRole(userRole, r) || userRole === r);
  if (!ok) throw new ForbiddenError(`Insufficient role. Allowed: ${allowed.join(', ')}`);
}

// Route-level guards
export const Guards = {
  tenants: (role: Role | undefined) => requireOneOfRoles(role, ['owner', 'admin']),
  templates: (role: Role | undefined) =>
    requireOneOfRoles(role, ['owner', 'admin', 'practitioner']),
  sessions: (role: Role | undefined) => requireOneOfRoles(role, ['owner', 'admin', 'practitioner']),
  readOnly: (role: Role | undefined) =>
    requireOneOfRoles(role, ['owner', 'admin', 'practitioner', 'viewer']),
  audit: (role: Role | undefined) => requireOneOfRoles(role, ['owner', 'admin']),
} as const;
