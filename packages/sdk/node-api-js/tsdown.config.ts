import { defineConfig } from 'tsdown';

export default defineConfig({
  // ts-types is a prod dep (value + types); keep it external so rolldown
  // does not inline TRANSACTION_TYPE and emit bare-import artifacts.
  deps: { neverBundle: ['@decentralchain/ts-types'] },
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
  fixedExtension: true,
  format: ['esm'],
  platform: 'neutral',
  sourcemap: true,
});
