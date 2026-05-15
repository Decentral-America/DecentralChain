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
      thresholds: {
        // Remaining uncovered branches are provider-dispatch error paths that
        // require live hardware or a connected wallet for full exercising.
        branches: 88,
      },
    },
  },
});
