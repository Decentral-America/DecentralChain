import { mergeConfig } from 'vitest/config';
import baseConfig from '../../../vitest.base.config';

// All 17 generated protobuf files are at 100% coverage (150 tests).
// Threshold inherits from vitest.base.config (90%) — no per-package override needed.
export default mergeConfig(baseConfig, {});
