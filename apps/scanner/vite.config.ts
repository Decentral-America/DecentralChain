import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import type {} from 'vitest/config';

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
  server: {
    proxy: {
      '/api/geo': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geo/, ''),
        target: 'https://ipinfo.io',
      },
      '/api/greencheck': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/greencheck/, '/api/v3/greencheck'),
        target: 'https://api.thegreenwebfoundation.org',
      },
    },
  },
  test: {
    coverage: {
      exclude: ['src/root.tsx', 'src/vite-env.d.ts', 'src/**/*.d.ts', 'src/test/**'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    css: true,
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
