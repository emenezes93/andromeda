import type { Container } from '@core/infrastructure/di/Container.js';

declare module 'fastify' {
  interface FastifyInstance {
    container?: Container;
  }
}
