import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    exclude: [
      'test/integration/**',
      'test/test.spec.ts',
      'test/nodeInteraction.spec.ts',
      'test/proto-serialize.spec.ts',
    ],
    include: ['test/**/*.spec.ts'],
    testTimeout: 30000,
  },
});
