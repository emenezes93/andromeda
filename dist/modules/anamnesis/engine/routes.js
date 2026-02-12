import { z } from 'zod';
import { requireTenant } from '../../../plugins/tenant.js';
import { requireAuth } from '../../../plugins/auth.js';
import { Guards } from '../../../shared/rbac.js';
import { NotFoundError } from '../../../shared/errors.js';
import { getNextQuestion } from './engine.js';
const nextQuestionBodySchema = z.object({
    sessionId: z.string(),
    currentAnswers: z.record(z.unknown()).default({}),
});
export async function engineRoutes(fastify) {
    fastify.post('/v1/anamnesis/engine/next-question', {
        schema: {
            body: { $ref: 'NextQuestionBody#' },
            response: { 200: { $ref: 'NextQuestionResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        requireAuth(request);
        Guards.sessions(request.user.role);
        const body = nextQuestionBodySchema.parse(request.body);
        const session = await fastify.prisma.anamnesisSession.findFirst({
            where: { id: body.sessionId, tenantId },
            include: { template: true },
        });
        if (!session)
            throw new NotFoundError('Session not found');
        const schema = session.template.schemaJson;
        const result = getNextQuestion(schema, body.currentAnswers);
        return reply.status(200).send(result);
    });
}
//# sourceMappingURL=routes.js.map