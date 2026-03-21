import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: ['src/index.ts', 'src/bytes.ts', 'src/libs/**'],
      thresholds: {
        // Cryptographic edge-case branches (malformed key sizes, error-path
        // decode failures) require known-bad test vectors not included in
        // the upstream test suite.
        branches: 83,
      },
    },
  },
});
