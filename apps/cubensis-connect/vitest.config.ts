import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      bail: 1,
      exclude: ['test/helpers/**', 'test/utils/**', 'test/fixtures/**', 'test/Update.ts'],
      fileParallelism: false,
      hookTimeout: 300_000,
      include: ['test/**/*.ts'],
      sequence: { concurrent: false },
      setupFiles: ['test/utils/hooks.ts'],
      testTimeout: 300_000,
    },
  }),
);
