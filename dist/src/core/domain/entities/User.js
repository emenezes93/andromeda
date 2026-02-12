/**
 * Domain Entity: User
 * Pure business logic, no infrastructure dependencies
 */
export class User {
    id;
    email;
    passwordHash;
    name;
    createdAt;
    deletedAt;
    constructor(id, email, passwordHash, name, createdAt, deletedAt = null) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.createdAt = createdAt;
        this.deletedAt = deletedAt;
    }
    static create(email, passwordHash, name = null) {
        return new User('', email, passwordHash, name, new Date(), null);
    }
    isDeleted() {
        return this.deletedAt !== null;
    }
}
//# sourceMappingURL=User.js.map