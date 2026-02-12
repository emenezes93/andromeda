export class Tenant {
    id;
    name;
    status;
    createdAt;
    deletedAt;
    constructor(id, name, status, createdAt, deletedAt = null) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.createdAt = createdAt;
        this.deletedAt = deletedAt;
    }
    static create(name) {
        return new Tenant('', name, 'active', new Date(), null);
    }
    isActive() {
        return this.status === 'active' && !this.isDeleted();
    }
    isDeleted() {
        return this.deletedAt !== null;
    }
    suspend() {
        return new Tenant(this.id, this.name, 'suspended', this.createdAt, this.deletedAt);
    }
    activate() {
        return new Tenant(this.id, this.name, 'active', this.createdAt, this.deletedAt);
    }
}
//# sourceMappingURL=Tenant.js.map