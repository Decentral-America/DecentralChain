import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      thresholds: {
        // Hardware-wallet interaction branches require a physical Ledger device
        // to exercise USB transport and APDU error paths; not testable in CI.
        branches: 80,
      },
    },
  },
});
