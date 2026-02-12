/**
 * Domain Entity: Membership
 * Represents user-tenant relationship with role
 */
export type Role = 'owner' | 'admin' | 'practitioner' | 'viewer';
export declare class Membership {
    readonly id: string;
    readonly userId: string;
    readonly tenantId: string;
    readonly role: Role;
    readonly createdAt: Date;
    constructor(id: string, userId: string, tenantId: string, role: Role, createdAt: Date);
    static create(userId: string, tenantId: string, role: Role): Membership;
    hasMinimumRole(required: Role): boolean;
}
//# sourceMappingURL=Membership.d.ts.map