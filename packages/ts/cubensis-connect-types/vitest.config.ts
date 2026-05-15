import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      // V8 coverage thresholds are not meaningful for a types-only package
      // (0 executable statements). Type safety is validated via expectTypeOf tests.
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  },
});
