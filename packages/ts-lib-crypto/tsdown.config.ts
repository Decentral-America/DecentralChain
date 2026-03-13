import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/bytes.ts'],
    fixedExtension: true,
    platform: 'neutral',
    sourcemap: true,
  },
  {
    deps: { neverBundle: ['node:crypto'] },
    entry: ['src/rsa.ts'],
    platform: 'node',
    sourcemap: true,
  },
]);
