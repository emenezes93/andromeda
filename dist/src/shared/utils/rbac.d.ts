import type { Role } from '../types/index.js';
export declare function hasMinimumRole(userRole: Role, required: Role): boolean;
export declare function requireRole(userRole: Role | undefined, required: Role): void;
export declare function requireOneOfRoles(userRole: Role | undefined, allowed: Role[]): void;
export declare const Guards: {
    readonly tenants: (role: Role | undefined) => void;
    readonly templates: (role: Role | undefined) => void;
    readonly sessions: (role: Role | undefined) => void;
    readonly readOnly: (role: Role | undefined) => void;
    readonly audit: (role: Role | undefined) => void;
};
//# sourceMappingURL=rbac.d.ts.map