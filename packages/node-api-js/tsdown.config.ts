import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: true,
  entry: [
    'src/index.ts',
    'src/api-node/transactions/index.ts',
    'src/api-node/blocks/index.ts',
    'src/api-node/addresses/index.ts',
    'src/api-node/assets/index.ts',
    'src/api-node/rewards/index.ts',
    'src/api-node/debug/index.ts',
    'src/api-node/alias/index.ts',
    'src/api-node/node/index.ts',
    'src/api-node/peers/index.ts',
    'src/api-node/leasing/index.ts',
    'src/api-node/eth/index.ts',
  ],
  format: ['esm'],
  sourcemap: true,
});
