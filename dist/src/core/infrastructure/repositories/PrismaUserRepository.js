import { User } from '../../domain/entities/User.js';
/**
 * Adapter: Prisma User Repository Implementation
 */
export class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return null;
        return this.toDomain(user);
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            return null;
        return this.toDomain(user);
    }
    async create(user) {
        const created = await this.prisma.user.create({
            data: {
                email: user.email,
                passwordHash: user.passwordHash,
                name: user.name,
            },
        });
        return this.toDomain(created);
    }
    async exists(email) {
        const count = await this.prisma.user.count({ where: { email } });
        return count > 0;
    }
    toDomain(prismaUser) {
        return new User(prismaUser.id, prismaUser.email, prismaUser.passwordHash, prismaUser.name, prismaUser.createdAt, prismaUser.deletedAt);
    }
}
//# sourceMappingURL=PrismaUserRepository.js.map