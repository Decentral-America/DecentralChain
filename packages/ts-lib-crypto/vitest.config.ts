import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: ['src/index.ts', 'src/bytes.ts', 'src/libs/**'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
