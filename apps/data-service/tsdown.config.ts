import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/daemons/pairs/index.ts'],
  format: 'esm',
  platform: 'node',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
});
