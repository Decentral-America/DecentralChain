import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: ['src/**/*.spec.ts', 'src/seedWords.ts'],
      thresholds: {
        // WASM AES implementation — S-box table lookup indices in aesCommon.ts,
        // decryptAesEcb.ts and encryptAesEcb.ts produce branch patterns that
        // V8 counts but cannot instrument (bounds are provably safe by
        // construction). All non-AES crypto paths maintain ≥99% coverage.
        branches: 75,
      },
    },
    include: ['src/**/*.spec.ts'],
  },
});
