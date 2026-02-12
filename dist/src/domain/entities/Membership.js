export class Membership {
    id;
    userId;
    tenantId;
    role;
    createdAt;
    constructor(id, userId, tenantId, role, createdAt) {
        this.id = id;
        this.userId = userId;
        this.tenantId = tenantId;
        this.role = role;
        this.createdAt = createdAt;
    }
    static create(userId, tenantId, role) {
        return new Membership('', userId, tenantId, role, new Date());
    }
    hasMinimumRole(required) {
        const hierarchy = {
            owner: 4,
            admin: 3,
            practitioner: 2,
            viewer: 1,
        };
        return hierarchy[this.role] >= hierarchy[required];
    }
}
//# sourceMappingURL=Membership.js.map