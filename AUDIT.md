# Audit: node-api-js (Decentral-America fork)

## package.json
- name: @decentralchain/node-api-js (already updated)
- @waves/* deps: @waves/bignumber, @waves/ts-types (NOT updated)
- @waves/ts-lib-crypto: imported in src but NOT in package.json
- devDependencies: @decentralchain/node-state, @decentralchain/waves-transactions (already updated)
- repository.url: not set

## Hardcoded URLs
- https://nodes-stagenet.wavesnodes.com/ in test/api-node/debug.spec.ts
- No wavesnodes URLs in source code

## Chain IDs
- No 'W' or 87 references found

## Port 6869
- No references found

## @waves imports (source files)
- @waves/ts-types: 16 files
- @waves/bignumber: 2 files
- @waves/ts-lib-crypto: 4 files

## @waves imports (test files)
- @waves/ts-types: 4 files

## Files with "waves" in name
- src/tools/adresses/wavesAddress2eth.ts
- src/tools/adresses/ethAddress2waves.ts
- src/tools/transactions/ethTxId2waves.ts
- src/tools/assets/wavesAsset2eth.ts

## Functions/variables with "waves" in name
- wavesAddress2eth, ethAddress2waves, wavesAsset2Eth, ethTxId2waves
- wavesFee (11 references), wavesAddress, wavesBytes, wavesAsset
- totalWavesAmount (API type field)

## Assessment
- Fork cleanliness: ~30%
- Source code NOT cleaned of @waves references
- Estimated remaining work: 2-3 hours
