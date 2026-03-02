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
      exclude: [
        'src/index.ts',
        // Pure type declarations — no runtime code to cover
        'src/interface.ts',
        // API-node modules require a running DecentralChain node;
        // covered by integration tests (vitest.integration.config.ts)
        'src/api-node/**',
        // Network-dependent tools — covered by integration tests
        'src/tools/adresses/watch.ts',
        'src/tools/adresses/getAssetsByTransaction.ts',
        'src/tools/adresses/getTransactionsWithAssets.ts',
        'src/tools/adresses/availableSponsoredBalances.ts',
        'src/tools/blocks/detectInterval.ts',
        'src/tools/blocks/getNetworkByte.ts',
        'src/tools/blocks/getNetworkCode.ts',
        'src/tools/blocks/waitHeight.ts',
        'src/tools/transactions/broadcast.ts',
        'src/tools/transactions/wait.ts',
        'src/tools/transactions/transactions.ts',
      ],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    reporters: ['default'],
    typecheck: { enabled: false },
    setupFiles: ['test/extendedMatcher.ts'],
  },
});
