import { mergeConfig } from 'vitest/config';
import baseConfig from '../../../vitest.base.config';

/**
 * Integration test config — runs tests that are excluded from the default config
 * because they require a running DCC node (local or remote).
 *
 * Usage:
 *   npx vitest run --config vitest.integration.config.ts
 */
export default mergeConfig(baseConfig, {
  test: {
    include: [
      'test/nodeInteraction.spec.ts',
      'test/proto-serialize.spec.ts',
      'test/integration/**/*.spec.ts',
    ],
    testTimeout: 120_000,
    typecheck: { enabled: false },
  },
});
