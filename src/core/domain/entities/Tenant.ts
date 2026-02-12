/**
 * Domain Entity: Tenant
 */
export type TenantStatus = 'active' | 'suspended';

export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly status: TenantStatus,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null = null
  ) {}

  static create(name: string): Tenant {
    return new Tenant('', name, 'active', new Date(), null);
  }

  isActive(): boolean {
    return this.status === 'active' && !this.isDeleted();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  suspend(): Tenant {
    return new Tenant(this.id, this.name, 'suspended', this.createdAt, this.deletedAt);
  }

  activate(): Tenant {
    return new Tenant(this.id, this.name, 'active', this.createdAt, this.deletedAt);
  }
}
