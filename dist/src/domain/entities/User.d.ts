/**
 * Domain Entity: User
 * Pure business logic, no infrastructure dependencies
 */
export declare class User {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly name: string | null;
    readonly createdAt: Date;
    readonly deletedAt: Date | null;
    constructor(id: string, email: string, passwordHash: string, name: string | null, createdAt: Date, deletedAt?: Date | null);
    static create(email: string, passwordHash: string, name?: string | null): User;
    isDeleted(): boolean;
}
//# sourceMappingURL=User.d.ts.map