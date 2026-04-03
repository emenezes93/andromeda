import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    /** Load/perf scenarios: run explicitly via `npm run test:performance` */
    exclude: ['tests/performance/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        'dist/**',
        'src/bootstrap/server.ts',
        'prisma/**',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
    testTimeout: 15000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@domain': path.resolve(__dirname, './src/core/domain'),
      '@application': path.resolve(__dirname, './src/core/application'),
      '@ports': path.resolve(__dirname, './src/core/ports'),
      '@infrastructure': path.resolve(__dirname, './src/core/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/core/presentation'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@config': path.resolve(__dirname, './src/config'),
      '@http': path.resolve(__dirname, './src/http'),
      '@bootstrap': path.resolve(__dirname, './src/bootstrap'),
    },
  },
});
