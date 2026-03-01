import { defineConfig } from 'vitest/config';

/**
 * Integration test configuration.
 *
 * These tests require a running DecentralChain node.
 * Set DCC_NODE_URL and related environment variables before running.
 *
 *   DCC_NODE_URL=https://nodes.decentralchain.io npm run test:integration
 */
export default defineConfig({
  test: {
    globals: true,
    include: [
      'test/api-node/**/*.spec.ts',
      'test/tools/broadcast.spec.ts',
      'test/tools/addresses/index.spec.ts',
      'test/tools/blocks/index.spec.ts',
    ],
    testTimeout: 30_000,
    reporters: ['default'],
    typecheck: { enabled: false },
    setupFiles: ['test/extendedMatcher.ts'],
  },
});
