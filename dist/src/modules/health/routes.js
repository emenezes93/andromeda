export async function healthRoutes(fastify) {
    fastify.get('/health', async (_, reply) => {
        return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
    });
    fastify.get('/ready', async (request, reply) => {
        try {
            await fastify.prisma.$queryRaw `SELECT 1`;
            return reply.status(200).send({ status: 'ready' });
        }
        catch (err) {
            request.log.error({ err }, 'Readiness check failed');
            return reply.status(503).send({ status: 'not ready', error: 'Database unavailable' });
        }
    });
}
//# sourceMappingURL=routes.js.map