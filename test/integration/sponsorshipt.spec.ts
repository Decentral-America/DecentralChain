<<<<<<< HEAD
<<<<<<< HEAD:test/integration/sponsorshipt.test.ts
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
import { broadcast, issue, sponsorship, transfer, waitForTx} from '../../src'
import {API_BASE, CHAIN_ID, MASTER_SEED, TIMEOUT} from './config'
import {address} from '@decentralchain/ts-lib-crypto'
import {validate} from '../../src/validators'
<<<<<<< HEAD
=======
import { broadcast, issue, sponsorship, transfer, waitForTx } from '../../src'
import { API_BASE, CHAIN_ID, MASTER_SEED, TIMEOUT } from './config'
import { address } from '@decentralchain/ts-lib-crypto'
import { validate } from '../../src/validators'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
import { broadcast, issue, sponsorship, transfer, waitForTx } from '../../src';
import { API_BASE, CHAIN_ID, MASTER_SEED, TIMEOUT } from './config';
import { address } from '@decentralchain/ts-lib-crypto';
import { validate } from '../../src/validators';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/integration/sponsorshipt.spec.ts
=======
import { address } from '@decentralchain/ts-lib-crypto';
import { broadcast, issue, sponsorship, transfer, waitForTx } from '../../src';
import { API_BASE, CHAIN_ID, MASTER_SEED, TIMEOUT } from './config';
>>>>>>> e3d703a4 (chore: migrate from ESLint/Prettier/Husky to Biome/Lefthook)

describe('Sponsorship', () => {
  let assetId: string;

  it(
    'Issue asset for sponsorship',
    async () => {
      const issueTx = issue(
        {
          decimals: 8,
          name: 'testAsset',
          description: '',
          quantity: '9000000000000',
          reissuable: true,
          chainId: CHAIN_ID,
        },
        MASTER_SEED,
      );
      assetId = issueTx.id;
      await broadcast(issueTx, API_BASE);

      await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: 10000 });
    },
    TIMEOUT,
  );

  it(
    'Should set sponsorship',
    async () => {
      const sponTx = sponsorship(
        { assetId, minSponsoredAssetFee: '100000', chainId: CHAIN_ID },
        MASTER_SEED,
      );
      await broadcast(sponTx, API_BASE);
      await waitForTx(sponTx.id, { timeout: TIMEOUT, apiBase: API_BASE });

      const ttx = transfer(
        {
          recipient: address(MASTER_SEED, CHAIN_ID),
          amount: '100',
          feeAssetId: assetId,
          fee: '100000',
          chainId: CHAIN_ID,
        },
        MASTER_SEED,
      );
      await broadcast(ttx, API_BASE);
    },
    TIMEOUT,
  );

<<<<<<< HEAD
    it('Should remove sponsorship', async () => {
        const sponTx = sponsorship({assetId, minSponsoredAssetFee: null, chainId: CHAIN_ID}, MASTER_SEED)
        await broadcast(sponTx, API_BASE)
        await waitForTx(sponTx.id, {timeout: TIMEOUT, apiBase: API_BASE})
        const ttx = transfer({
            recipient: address(MASTER_SEED, CHAIN_ID),
            amount: 1000,
            feeAssetId: assetId
        }, MASTER_SEED)
        await expect(broadcast(ttx, API_BASE)).rejects
=======
import { broadcast, sponsorship, transfer, waitForTx } from '../../src'
import { API_BASE, MASTER_SEED, TIMEOUT, CHAIN_ID } from './config'
import { address } from '@waves/ts-lib-crypto'
=======
>>>>>>> f33083a0 (updated dependencies)

describe('Sponsorship', () => {
    let assetId: string;

    it('Issue asset for sponsorship', async () => {
        const issueTx = issue({
            decimals: 8,
            name: 'testAsset',
            description: '',
            quantity: '9000000000000',
            reissuable: true,
            chainId: CHAIN_ID,
        }, MASTER_SEED)
        assetId = issueTx.id
        await broadcast(issueTx, API_BASE)

        await waitForTx(issueTx.id, {apiBase: API_BASE, timeout: 10000})
    }, TIMEOUT)

<<<<<<< HEAD
  it('Should remove sponsorship', async () => {
      const sponTx = sponsorship({ assetId, minSponsoredAssetFee: 0, additionalFee: 4000000 , chainId: CHAIN_ID}, MASTER_SEED)
      await broadcast(sponTx, API_BASE)
      await waitForTx(sponTx.id, { timeout: TIMEOUT, apiBase: API_BASE })
      const ttx = transfer({ recipient: address(MASTER_SEED, CHAIN_ID), amount: 1000, feeAssetId: assetId }, MASTER_SEED)
      await expect(broadcast(ttx, API_BASE)).rejects
>>>>>>> 697d643a (minor fixes)
=======
    it('Should set sponsorship', async () => {
        const sponTx = sponsorship({assetId, minSponsoredAssetFee: '100000', chainId: CHAIN_ID}, MASTER_SEED)
        await broadcast(sponTx, API_BASE)
        await waitForTx(sponTx.id, {timeout: TIMEOUT, apiBase: API_BASE})

        const ttx = transfer({
            recipient: address(MASTER_SEED, CHAIN_ID),
            amount: '100',
            feeAssetId: assetId,
            fee: '100000',
            chainId: CHAIN_ID
        }, MASTER_SEED)
        await broadcast(ttx, API_BASE)
    }, TIMEOUT)

    it('Should remove sponsorship', async () => {
        const sponTx = sponsorship({assetId, minSponsoredAssetFee: null, chainId: CHAIN_ID}, MASTER_SEED)
        await broadcast(sponTx, API_BASE)
        await waitForTx(sponTx.id, {timeout: TIMEOUT, apiBase: API_BASE})
        const ttx = transfer({
            recipient: address(MASTER_SEED, CHAIN_ID),
            amount: 1000,
            feeAssetId: assetId
        }, MASTER_SEED)
        await expect(broadcast(ttx, API_BASE)).rejects
>>>>>>> f33083a0 (updated dependencies)
    }, TIMEOUT)
=======
  it(
    'Should remove sponsorship',
    async () => {
      const sponTx = sponsorship(
        { assetId, minSponsoredAssetFee: null, chainId: CHAIN_ID },
        MASTER_SEED,
      );
      await broadcast(sponTx, API_BASE);
      await waitForTx(sponTx.id, { timeout: TIMEOUT, apiBase: API_BASE });
      const ttx = transfer(
        {
          recipient: address(MASTER_SEED, CHAIN_ID),
          amount: 1000,
          feeAssetId: assetId,
        },
        MASTER_SEED,
      );
      await expect(broadcast(ttx, API_BASE)).rejects;
    },
    TIMEOUT,
<<<<<<< HEAD:test/integration/sponsorshipt.test.ts
  )
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
})
=======
  );
});
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/integration/sponsorshipt.spec.ts
