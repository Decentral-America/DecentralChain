import { address, publicKey } from '@decentralchain/ts-lib-crypto';
import {
  alias,
  broadcast,
  burn,
  exchange,
  type IBurnParams,
  type IIssueParams,
  type IMassTransferParams,
  type IReissueParams,
  type ISetAssetScriptParams,
  type ITransferParams,
  issue,
  massTransfer,
  order,
  reissue,
  setAssetScript,
  transfer,
  waitForTx,
} from '../../src';
import { issueMinimalParams } from '../minimalParams';
import { API_BASE, CHAIN_ID, MASTER_SEED, randomHexString, TIMEOUT } from './config';

describe('Assets', () => {
  const wvs = 10 ** 8;

  const account1 =
    'jungle property method used observe any mirror dial road famous wonder satisfy curve pledge piece';
  const account2 =
    'torch walk scout grocery drum infant antique fatal boil key salute ribbon trick bean object';

  const address1 = address(account1, CHAIN_ID);
  const address2 = address(account2, CHAIN_ID);

  beforeAll(async () => {
    vi.setConfig({ testTimeout: 60000 });

    const mtt = massTransfer(
      {
        transfers: [
          { amount: 5.016 * wvs, recipient: address(account1, CHAIN_ID) },
          { amount: 0.1 * wvs, recipient: address(account2, CHAIN_ID) },
        ],
      },
      MASTER_SEED,
    );
    await broadcast(mtt, API_BASE);
    await waitForTx(mtt.id, { apiBase: API_BASE, timeout: TIMEOUT });
  }, TIMEOUT);

  describe('Ordinary assets', () => {
    let assetId = '';

    it(
      'Should ISSUE new token',
      async () => {
        const txParams: IIssueParams = {
          additionalFee: 400000,
          chainId: CHAIN_ID,
          decimals: 3,
          description: 'no description',
          name: 'Test token',
          quantity: 1000,
          reissuable: true,
        };

        const tx = issue(txParams, account1);
        assetId = tx.id;
        const resp = await broadcast(tx, API_BASE);
        await waitForTx(assetId, { apiBase: API_BASE, timeout: TIMEOUT });
        expect(resp.type).toEqual(3);
      },
      TIMEOUT,
    );

    it('Should ReIssue token', async () => {
      const txParams: IReissueParams = {
        assetId,
        chainId: CHAIN_ID,
        quantity: 1000,
        reissuable: true,
      };
      const tx = reissue(txParams, account1);
      const resp = await broadcast(tx, API_BASE);
      expect(resp.type).toEqual(5);
    });

    it('Should BURN token', async () => {
      const burnParams: IBurnParams = {
        amount: 500,
        assetId,
        chainId: CHAIN_ID,
      };
      const burnTx = burn(burnParams, account1);
      const resp = await broadcast(burnTx, API_BASE);
      expect(resp.type).toEqual(6);
    });

    it('Should transfer asset', async () => {
      const transferParams: ITransferParams = {
        amount: '500',
        assetId,
        attachment: '3MyAGEBuZGDKZDzYn6sbh2noqk9uYHy4kjw',
        recipient: address2,
      };

      const tx = transfer(transferParams, account1);
      const resp = await broadcast(tx, API_BASE);
      expect(resp.type).toEqual(4);
    });

    it('Should masstransfer asset', async () => {
      const massTransferParams: IMassTransferParams = {
        //fee:'200000',
        assetId,
        transfers: [
          {
            amount: '100',
            recipient: address1,
          },
          {
            amount: '100',
            recipient: address2,
          },
        ],
      };

      const tx = massTransfer(massTransferParams, account1);
      const resp = await broadcast(tx, API_BASE);
      expect(resp.type).toEqual(11);
      expect(resp.id).toEqual(tx.id);
    });
  });

  describe('Scripted assets', () => {
    let assetId = '';

    it(
      'Should issue token with script. Should execute token script',
      async () => {
        // script prohibits burn transaction
        const script =
          'AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA==';
        const txParams: IIssueParams = {
          chainId: CHAIN_ID,
          decimals: 3,
          description: 'no description',
          name: 'scriptedToken',
          quantity: 10000,
          reissuable: true,
          script,
        };
        const tx = issue(txParams, account1);
        const resp = await broadcast(tx, API_BASE);
        expect(resp.type).toEqual(3);
        assetId = tx.id;
        await waitForTx(assetId, { apiBase: API_BASE, timeout: TIMEOUT });

        const burnParams: IBurnParams = {
          amount: 1000,
          assetId,
          chainId: CHAIN_ID,
        };
        const burnTx = burn(burnParams, account1);
        const respPromise = broadcast(burnTx, API_BASE);
        await expect(respPromise).rejects.toMatchObject({ error: 112 });
      },
      TIMEOUT + 20000,
    );

    it(
      'Should set new token script. Should execute new token script',
      async () => {
        // script allows everything
        const script = 'AQa3b8tH';
        const txParams: ISetAssetScriptParams = {
          assetId,
          chainId: CHAIN_ID,
          script,
        };
        const tx = setAssetScript(txParams, account1);
        const resp = await broadcast(tx, API_BASE);
        expect(resp.type).toEqual(15);
        await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

        const burnParams: IBurnParams = {
          additionalFee: 400000,
          amount: '1000',
          assetId,
          chainId: CHAIN_ID,
        };
        const burnTx = burn(burnParams, account1);
        const burnResp = await broadcast(burnTx, API_BASE);
        expect(burnResp.type).toEqual(6);
      },
      TIMEOUT + 20000,
    );
  });

  describe('NFT assets', () => {
    it(
      'Should issue nft asset',
      async () => {
        const tx = issue(
          {
            ...issueMinimalParams,
            chainId: CHAIN_ID,
            decimals: 0,
            quantity: 1,
          },
          account1,
        );

        const resp = await broadcast(tx, API_BASE);
        await waitForTx(tx.id, { apiBase: API_BASE });

        expect(resp.type).toEqual(3);
      },
      TIMEOUT,
    );
  });

  describe('Other', () => {
    it(
      'Should create alias for address',
      async () => {
        const aliasStr: string = randomHexString(10);
        const aliasTx = alias({ alias: aliasStr, chainId: CHAIN_ID }, account1);
        const resp = await broadcast(aliasTx, API_BASE);
        expect(resp.type).toEqual(10);
        await waitForTx(aliasTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
        const ttx = transfer(
          { amount: 1000, recipient: `alias:${CHAIN_ID}:${aliasStr}` },
          account1,
        );
        const ttxResp = await broadcast(ttx, API_BASE);
        expect(ttxResp.type).toEqual(4);
      },
      TIMEOUT,
    );

    it(
      'Should perform exchange transaction',
      async () => {
        try {
          // ISSUE ASSET
          const account2 = 'exchange test';
          const txParams: IIssueParams = {
            chainId: CHAIN_ID,
            description: 'no description',
            name: 'Test token',
            //decimals: 3,
            quantity: 100000000000,
            reissuable: true,
          };

          const issueTx = issue(txParams, account1);
          const assetId = issueTx.id;
          await broadcast(issueTx, API_BASE);
          // GIVE DCC TO TEST ACC
          // const transferTx = transfer({ recipient: address(account2, CHAIN_ID), amount: 100000000, chainId: CHAIN_ID }, MASTER_SEED)
          // await broadcast(transferTx, API_BASE)

          //WAIT BOTH TX TO COMPLETE
          await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
          // await waitForTx(transferTx.id, { timeout: TIMEOUT, apiBase: API_BASE })
          /////////////////////////

          //assetId = 'qmhEv7NeL39kDiWBVfzZh6aT1ZwzpD7y1CFxvmiH78U'

          const order1 = order(
            {
              amount: 1,
              amountAsset: assetId,
              matcherFee: 300000,
              //matcherPublicKey,
              matcherPublicKey: publicKey(account1),
              orderType: 'buy',
              price: 10000,
              priceAsset: null,
            },
            account2,
          );

          const order2 = order(
            {
              amount: 1,
              amountAsset: assetId,
              matcherFee: 300000,
              //matcherPublicKey,
              matcherPublicKey: publicKey(account1),
              orderType: 'sell',
              price: 10000,
              priceAsset: null,
            },
            account1,
          );

          //await submitOrder(order1, matcherUrl)
          //await submitOrder(order2, matcherUrl)

          const exchangeTx = exchange(
            {
              amount: 1,
              buyMatcherFee: order1.matcherFee,
              chainId: CHAIN_ID.charCodeAt(0),
              fee: 300000,
              order1,
              order2,
              price: 10000,
              proofs: [],
              sellMatcherFee: order2.matcherFee,
              senderPublicKey: publicKey(account1),
              timestamp: Date.now(),
              type: 7,
              version: 2,
            },
            account1,
          );

          const resp = await broadcast(exchangeTx, API_BASE);
          expect(resp.type).toEqual(7);
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      TIMEOUT,
    );
  });
});
