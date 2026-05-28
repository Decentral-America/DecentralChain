import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts', 'src/daemons/pairs/index.ts'],
  format: 'esm',
  noExternal: ['knex'],
  outDir: 'dist',
  platform: 'node',
  sourcemap: true,
});
