import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
function keyGenerator(request) {
    const user = request.user;
    return user ? `user:${user.userId}` : `ip:${request.ip ?? 'unknown'}`;
}
async function rateLimitPlugin(fastify, opts) {
    await fastify.register(rateLimit, {
        max: opts.global,
        timeWindow: '1 minute',
        keyGenerator,
    });
}
export default fp(rateLimitPlugin, { name: 'rate-limit' });
//# sourceMappingURL=rateLimit.js.map