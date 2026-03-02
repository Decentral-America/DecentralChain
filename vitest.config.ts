import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    // Integration tests require a running DecentralChain node.
    // Run with: npm run test:integration
    exclude: [
      'test/api-node/**',
      'test/tools/broadcast.spec.ts',
      'test/tools/addresses/index.spec.ts',
      'test/tools/blocks/index.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 70,
        functions: 50,
        lines: 60,
        statements: 60,
      },
    },
    reporters: ['default'],
    typecheck: { enabled: false },
    setupFiles: ['test/extendedMatcher.ts'],
  },
});
