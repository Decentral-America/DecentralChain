import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    dts: true,
    entry: ['src/index.ts', 'src/bytes.ts'],
    fixedExtension: true,
    format: ['esm'],
    platform: 'neutral',
    sourcemap: true,
  },
  {
    deps: { neverBundle: ['node:crypto'] },
    dts: true,
    entry: ['src/rsa.ts'],
    format: ['esm'],
    platform: 'node',
    sourcemap: true,
  },
]);
