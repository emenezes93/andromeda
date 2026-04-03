import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (
            id.includes('@react-pdf/') ||
            id.includes('pdfkit') ||
            id.includes('fontkit') ||
            id.includes('yoga-layout') ||
            id.includes('unicode-properties') ||
            id.includes('unicode-trie') ||
            id.includes('linebreak')
          ) {
            return 'vendor-react-pdf';
          }
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('@headlessui/react')) return 'vendor-headlessui';
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/resolvers') ||
            id.includes('zod')
          ) {
            return 'vendor-forms';
          }
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('posthog-js')) return 'vendor-analytics';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';

          return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ready': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
