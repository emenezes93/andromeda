import { ForbiddenError } from './errors.js';
const hierarchy = {
    owner: 4,
    admin: 3,
    practitioner: 2,
    viewer: 1,
};
export function hasMinimumRole(userRole, required) {
    return hierarchy[userRole] >= hierarchy[required];
}
export function requireRole(userRole, required) {
    if (!userRole)
        throw new ForbiddenError('Authentication required');
    if (!hasMinimumRole(userRole, required)) {
        throw new ForbiddenError(`Insufficient role. Required: ${required}`);
    }
}
export function requireOneOfRoles(userRole, allowed) {
    if (!userRole)
        throw new ForbiddenError('Authentication required');
    const ok = allowed.some((r) => hasMinimumRole(userRole, r) || userRole === r);
    if (!ok)
        throw new ForbiddenError(`Insufficient role. Allowed: ${allowed.join(', ')}`);
}
// Route-level guards
export const Guards = {
    tenants: (role) => requireOneOfRoles(role, ['owner', 'admin']),
    templates: (role) => requireOneOfRoles(role, ['owner', 'admin', 'practitioner']),
    sessions: (role) => requireOneOfRoles(role, ['owner', 'admin', 'practitioner']),
    readOnly: (role) => requireOneOfRoles(role, ['owner', 'admin', 'practitioner', 'viewer']),
    audit: (role) => requireOneOfRoles(role, ['owner', 'admin']),
};
//# sourceMappingURL=rbac.js.map