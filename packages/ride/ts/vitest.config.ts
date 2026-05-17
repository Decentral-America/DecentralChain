import { mergeConfig } from 'vitest/config';
import baseConfig from '../../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      include: ['src/**/*.js'],
      thresholds: {
        // Generated compiler/parser code (pre-compiled JS modules) has inherently
        // low branch coverage — complex AST traversal branches are not enumerable
        // from the public test surface without exhaustive language spec inputs.
        branches: 50,
        functions: 74,
        // Lines and statements below base 90% — same reason as branches above.
        lines: 81,
        statements: 80,
      },
    },
    environment: 'node',
    include: ['test/**/*.spec.{ts,js}'],
    testTimeout: 60_000,
  },
});
