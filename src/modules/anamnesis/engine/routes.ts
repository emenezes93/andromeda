import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { getNextQuestion } from './engine.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

const nextQuestionBodySchema = z.object({
  sessionId: z.string(),
  currentAnswers: z.record(z.unknown()).default({}),
});

export async function engineRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/anamnesis/engine/next-question',
    {
      schema: {
        body: { $ref: 'NextQuestionBody#' },
        response: { 200: { $ref: 'NextQuestionResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.sessions(request.user!.role);

      const body = nextQuestionBodySchema.parse(request.body);
      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id: body.sessionId, tenantId },
        include: { template: true },
      });
      if (!session) throw new NotFoundError('Session not found');

      const schema = session.template.schemaJson as unknown as TemplateSchemaJson;
      const result = getNextQuestion(schema, body.currentAnswers);
      return reply.status(200).send(result);
    }
  );
}
