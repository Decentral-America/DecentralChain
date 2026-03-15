import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: ['src/**/*.spec.ts', 'src/seedWords.ts'],
    },
    include: ['src/**/*.spec.ts'],
  },
});
