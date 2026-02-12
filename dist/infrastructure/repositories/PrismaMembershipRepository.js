/**
 * Adapter: Prisma Membership Repository Implementation
 */
export class PrismaMembershipRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId },
            include: { tenant: true },
        });
        if (!membership)
            return null;
        return this.toDomain(membership);
    }
    async findByUserIdAndTenantId(userId, tenantId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId, tenantId },
            include: { tenant: true, user: true },
        });
        if (!membership)
            return null;
        return this.toDomain(membership);
    }
    async create(membership) {
        const created = await this.prisma.membership.create({
            data: {
                userId: membership.userId,
                tenantId: membership.tenantId,
                role: membership.role,
            },
        });
        return this.toDomain(created);
    }
    toDomain(prismaMembership) {
        return new Membership(prismaMembership.id, prismaMembership.userId, prismaMembership.tenantId, prismaMembership.role, prismaMembership.createdAt);
    }
}
//# sourceMappingURL=PrismaMembershipRepository.js.map