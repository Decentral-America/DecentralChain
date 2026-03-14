import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['test/**/*.ts'],
      exclude: ['test/helpers/**', 'test/utils/**', 'test/fixtures/**', 'test/Update.ts'],
      testTimeout: 300_000,
      hookTimeout: 300_000,
      bail: 1,
      fileParallelism: false,
      sequence: { concurrent: false },
      setupFiles: ['test/utils/hooks.ts'],
    },
  }),
);
