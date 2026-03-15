import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: ['src/__tests__/**', 'src/index.ts'],
    },
    include: ['src/__tests__/**/*.test.ts'],
  },
});
