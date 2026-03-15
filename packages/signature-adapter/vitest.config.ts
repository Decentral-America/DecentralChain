import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: [
        'src/index.ts',
        'src/adapters/index.ts',
        'src/prepareTx/index.ts',
        'src/prepareTx/interfaces.ts',
      ],
    },
  },
});
