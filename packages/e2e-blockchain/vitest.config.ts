import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

/**
 * E2E blockchain test config. Runs against a live network (default: public testnet);
 * see packages/e2e-blockchain/README.md for the required environment.
 */
export default mergeConfig(baseConfig, {
  test: {
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/setup/env.ts'],
    singleThread: true,
    testTimeout: 300_000,
    typecheck: { enabled: false },
  },
});
