import { address } from '@decentralchain/ts-lib-crypto';
import { broadcast, issue, sponsorship, transfer, waitForTx } from '../../src';
import { API_BASE, CHAIN_ID, MASTER_SEED, TIMEOUT } from './config';

describe('Sponsorship', () => {
  let assetId: string;

  it(
    'Issue asset for sponsorship',
    async () => {
      const issueTx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 8,
          description: '',
          name: 'testAsset',
          quantity: '9000000000000',
          reissuable: true,
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
        { assetId, chainId: CHAIN_ID, minSponsoredAssetFee: '100000' },
        MASTER_SEED,
      );
      await broadcast(sponTx, API_BASE);
      await waitForTx(sponTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

      const ttx = transfer(
        {
          amount: '100',
          chainId: CHAIN_ID,
          fee: '100000',
          feeAssetId: assetId,
          recipient: address(MASTER_SEED, CHAIN_ID),
        },
        MASTER_SEED,
      );
      await broadcast(ttx, API_BASE);
    },
    TIMEOUT,
  );

  it(
    'Should remove sponsorship',
    async () => {
      const sponTx = sponsorship(
        { assetId, chainId: CHAIN_ID, minSponsoredAssetFee: null },
        MASTER_SEED,
      );
      await broadcast(sponTx, API_BASE);
      await waitForTx(sponTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      const ttx = transfer(
        {
          amount: 1000,
          feeAssetId: assetId,
          recipient: address(MASTER_SEED, CHAIN_ID),
        },
        MASTER_SEED,
      );
      await expect(broadcast(ttx, API_BASE)).rejects;
    },
    TIMEOUT,
  );
});
