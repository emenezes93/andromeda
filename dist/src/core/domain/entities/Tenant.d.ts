/**
 * Domain Entity: Tenant
 */
export type TenantStatus = 'active' | 'suspended';
export declare class Tenant {
    readonly id: string;
    readonly name: string;
    readonly status: TenantStatus;
    readonly createdAt: Date;
    readonly deletedAt: Date | null;
    constructor(id: string, name: string, status: TenantStatus, createdAt: Date, deletedAt?: Date | null);
    static create(name: string): Tenant;
    isActive(): boolean;
    isDeleted(): boolean;
    suspend(): Tenant;
    activate(): Tenant;
}
//# sourceMappingURL=Tenant.d.ts.map