/**
 * Domain Entity: Membership
 * Represents user-tenant relationship with role
 */
export type Role = 'owner' | 'admin' | 'practitioner' | 'viewer';

export class Membership {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly role: Role,
    public readonly active: boolean,
    public readonly createdAt: Date
  ) {}

  static create(userId: string, tenantId: string, role: Role, active: boolean = true): Membership {
    return new Membership('', userId, tenantId, role, active, new Date());
  }

  hasMinimumRole(required: Role): boolean {
    const hierarchy: Record<Role, number> = {
      owner: 4,
      admin: 3,
      practitioner: 2,
      viewer: 1,
    };
    return hierarchy[this.role] >= hierarchy[required];
  }
}
