import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
});
