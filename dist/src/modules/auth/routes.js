import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginBodySchema, registerBodySchema, refreshBodySchema, logoutBodySchema } from './schemas.js';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../../shared/errors/index.js';
import { requireTenant } from '../../http/middleware/tenant.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { Guards } from '../../shared/utils/rbac.js';
import { env } from '../../config/env.js';
import { auditLog } from '../../shared/utils/audit.js';
const ACCESS_TOKEN_EXPIRY = '15m';
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
function refreshTokenExpiresAt() {
    const date = new Date();
    date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return date;
}
export async function authRoutes(fastify) {
    fastify.post('/v1/auth/login', {
        config: { rateLimit: { max: Number(process.env.RATE_LIMIT_AUTH) || 10, timeWindow: '1 minute' } },
        schema: {
            body: { $ref: 'LoginBody#' },
            response: { 200: { $ref: 'LoginResponse#' } },
        },
    }, async (request, reply) => {
        const body = loginBodySchema.parse(request.body);
        const user = await fastify.prisma.user.findUnique({ where: { email: body.email } });
        if (!user)
            throw new UnauthorizedError('Invalid email or password');
        const match = await bcrypt.compare(body.password, user.passwordHash);
        if (!match)
            throw new UnauthorizedError('Invalid email or password');
        const membership = await fastify.prisma.membership.findFirst({
            where: { userId: user.id },
            include: { tenant: true },
        });
        if (!membership)
            throw new UnauthorizedError('User has no tenant membership');
        if (membership.tenant.status !== 'active')
            throw new ForbiddenError('Tenant is not active');
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: membership.role,
            tenantId: membership.tenantId,
        }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = crypto.randomUUID();
        await fastify.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tenantId: membership.tenantId,
                token: refreshToken,
                expiresAt: refreshTokenExpiresAt(),
            },
        });
        await auditLog(fastify.prisma, membership.tenantId, 'login', 'user', user.id, user.id, { email: user.email });
        return reply.status(200).send({
            token,
            refreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
            user: { id: user.id, email: user.email, name: user.name, role: membership.role, tenantId: membership.tenantId },
        });
    });
    fastify.post('/v1/auth/refresh', {
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
        schema: {
            body: { $ref: 'RefreshBody#' },
            response: { 200: { $ref: 'RefreshResponse#' } },
        },
    }, async (request, reply) => {
        const body = refreshBodySchema.parse(request.body);
        const stored = await fastify.prisma.refreshToken.findUnique({
            where: { token: body.refreshToken },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
        const membership = await fastify.prisma.membership.findFirst({
            where: { userId: stored.userId, tenantId: stored.tenantId },
            include: { tenant: true, user: true },
        });
        if (!membership)
            throw new UnauthorizedError('User has no tenant membership');
        if (membership.tenant.status !== 'active')
            throw new ForbiddenError('Tenant is not active');
        const token = jwt.sign({
            userId: membership.userId,
            email: membership.user.email,
            role: membership.role,
            tenantId: membership.tenantId,
        }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const newRefreshToken = crypto.randomUUID();
        await fastify.prisma.$transaction([
            fastify.prisma.refreshToken.update({
                where: { id: stored.id },
                data: { revokedAt: new Date() },
            }),
            fastify.prisma.refreshToken.create({
                data: {
                    userId: stored.userId,
                    tenantId: stored.tenantId,
                    token: newRefreshToken,
                    expiresAt: refreshTokenExpiresAt(),
                },
            }),
        ]);
        return reply.status(200).send({
            token,
            refreshToken: newRefreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        });
    });
    fastify.post('/v1/auth/logout', {
        schema: {
            body: { $ref: 'LogoutBody#' },
            response: { 204: { type: 'null' } },
        },
    }, async (request, reply) => {
        const body = logoutBodySchema.parse(request.body);
        await fastify.prisma.refreshToken.updateMany({
            where: { token: body.refreshToken, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return reply.status(204).send();
    });
    fastify.post('/v1/auth/register', {
        schema: {
            body: { $ref: 'RegisterBody#' },
            headers: { 'x-tenant-id': { type: 'string' } },
            response: { 201: { $ref: 'UserResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        const user = requireAuth(request);
        Guards.tenants(user.role);
        const body = registerBodySchema.parse(request.body);
        const existing = await fastify.prisma.user.findUnique({ where: { email: body.email } });
        if (existing)
            throw new BadRequestError('Email already registered');
        const passwordHash = await bcrypt.hash(body.password, 12);
        const newUser = await fastify.prisma.user.create({
            data: { email: body.email, passwordHash, name: body.name ?? null },
        });
        await fastify.prisma.membership.create({
            data: { userId: newUser.id, tenantId, role: 'practitioner' },
        });
        return reply.status(201).send({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
        });
    });
}
//# sourceMappingURL=routes.js.map