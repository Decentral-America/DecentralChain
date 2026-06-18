import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

/**
 * E2E blockchain test config.
 * All tests require a running DCC private node (docker-compose up).
 *
 * Usage:
 *   pnpm --filter @decentralchain/e2e-blockchain test
 *   docker compose -f packages/e2e-blockchain/docker-compose.yml up -d
 */
export default mergeConfig(baseConfig, {
  test: {
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/setup/env.ts'],
    singleThread: true,
    testTimeout: 120_000,
    typecheck: { enabled: false },
  },
});
