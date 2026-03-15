import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              priority: 20,
            },
            {
              name: 'recharts-vendor',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 15,
            },
            {
              name: 'radix-vendor',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 15,
            },
            {
              name: 'query-vendor',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              priority: 15,
            },
            {
              name: 'map-vendor',
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              priority: 15,
            },
            {
              name: 'sentry-vendor',
              test: /[\\/]node_modules[\\/]@sentry[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/**/*.d.ts', 'src/test/**'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
