import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              priority: 20,
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            },
            {
              name: 'recharts-vendor',
              priority: 15,
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
            },
            {
              name: 'radix-vendor',
              priority: 15,
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            },
            {
              name: 'query-vendor',
              priority: 15,
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            },
            {
              name: 'map-vendor',
              priority: 15,
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
            },
            {
              name: 'sentry-vendor',
              priority: 10,
              test: /[\\/]node_modules[\\/]@sentry[\\/]/,
            },
          ],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
  test: {
    coverage: {
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/**/*.d.ts', 'src/test/**'],
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
