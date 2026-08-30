import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: true,
  entry: ['src/index.ts'],
  fixedExtension: true,
  format: ['esm'],
  platform: 'neutral',
  sourcemap: true,
});
