import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Anamnese Inteligente PaaS API',
        version: '2.0.0',
        description: 'Multi-tenant Anamnese adaptativa e insights (IA mock)',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          tenantHeader: { type: 'apiKey', in: 'header', name: 'x-tenant-id' },
        },
      },
      security: [{ bearerAuth: [] }, { tenantHeader: [] }],
    } as object,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: { docExpansion: 'list', filter: true },
  });
}

export default fp(swaggerPlugin, { name: 'swagger' });
