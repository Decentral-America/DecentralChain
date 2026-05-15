import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      thresholds: {
        // Branch coverage is capped at ~88% — the remaining gap is in generated
        // data-codec error paths and optional-field sentinel branches that cannot
        // be reached without malformed on-chain oracle payloads.
        branches: 87,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
