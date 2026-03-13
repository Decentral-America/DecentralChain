import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/bytes.ts'],
    sourcemap: true,
    platform: 'neutral',
    fixedExtension: true,
  },
  {
    entry: ['src/rsa.ts'],
    sourcemap: true,
    platform: 'node',
    deps: { neverBundle: ['node:crypto'] },
  },
]);
