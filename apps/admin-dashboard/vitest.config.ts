import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  // Route modules import '@/lib/...'; tests import routes directly.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    coverage: {
      exclude: ['src/index.ts'],
      // lib/ and the server routes that carry auth and treasury logic.
      include: ['src/lib/**/*.ts', 'src/routes/**/*.ts'],
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  },
});
