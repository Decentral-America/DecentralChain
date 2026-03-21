import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      thresholds: {
        // Browser extension provider — initialization and event-listener branches
        // require a live extension context (chrome.runtime) unavailable in unit tests.
        branches: 82,
      },
    },
  },
});
