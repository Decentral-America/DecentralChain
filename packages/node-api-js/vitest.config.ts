import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
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
        'src/tools/blocks/getNetworkByte.ts',
        'src/tools/blocks/getNetworkCode.ts',
        'src/tools/transactions/broadcast.ts',
        'src/tools/transactions/wait.ts',
        'src/tools/transactions/transactions.ts',
      ],
    },
    // Integration tests require a running DecentralChain node.
    // Run with: npm run test:integration
    exclude: [
      'test/api-node/**',
      'test/tools/broadcast.spec.ts',
      'test/tools/addresses/index.spec.ts',
      'test/tools/blocks/index.spec.ts',
    ],
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/extendedMatcher.ts'],
    typecheck: { enabled: false },
  },
});
