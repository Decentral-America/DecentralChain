import { address } from '@decentralchain/ts-lib-crypto';
import { broadcast, libs, waitForTx } from '../src';
import { protoBytesToTx, txToProtoBytes } from '../src/proto-serialize';
import { alias } from '../src/transactions/alias';
import { burn } from '../src/transactions/burn';
import { cancelLease } from '../src/transactions/cancel-lease';
import { data } from '../src/transactions/data';
import { invokeScript } from '../src/transactions/invoke-script';
import { issue } from '../src/transactions/issue';
import { lease } from '../src/transactions/lease';
import { massTransfer } from '../src/transactions/mass-transfer';
import { reissue } from '../src/transactions/reissue';
import { setAssetScript } from '../src/transactions/set-asset-script';
import { setScript } from '../src/transactions/set-script';
import { sponsorship } from '../src/transactions/sponsorship';
import { transfer } from '../src/transactions/transfer';
import { updateAssetInfo } from '../src/transactions/update-asset-info';
import { txs } from './example-proto-tx';
import { exampleTxs } from './exampleTxs';
import { randomHexString, TIMEOUT } from './integration/config';
import { issueMinimalParams } from './minimalParams';
import { deleteProofsAndId } from './utils';

const nodeUrl = 'https://testnet-node.decentralchain.io/';
const masterSeed = 'dcc private node seed with DCC tokens';
const CHAIN_ID = 33;
let SEED = 'abc';
const wvs = 1e8;
let assetId = '';

/**
 * Longs as strings, remove unnecessary fields
 * @param t
 */

describe('serialize/deserialize', () => {
  const txss = Object.keys(exampleTxs).map((x) => (<any>exampleTxs)[x] as any);
  txss.forEach((tx) => {
    it(`type: ${tx.type}`, () => {
      // deleteProofsAndId(tx)
      //const parsed = protoBytesToTx(txToProtoBytes(tx))
      const txWithoutProofAndId = deleteProofsAndId(tx);
      const protoBytes = txToProtoBytes(txWithoutProofAndId);
      const parsed = protoBytesToTx(protoBytes);
      expect(parsed).toMatchObject(txWithoutProofAndId);
    });
  });

  it(
    'correctly serialized transactions',
    () => {
      Object.entries(txs).forEach(([_name, { Bytes, Json }]) => {
        const actualBytes = libs.crypto.base16Encode(txToProtoBytes(Json as any));
        const expectedBytes = libs.crypto.base16Encode(libs.crypto.base64Decode(Bytes));
        expect(expectedBytes).toBe(actualBytes);
      });
    },
    TIMEOUT,
  );
});

describe('transactions v3', () => {
  beforeAll(async () => {
    const nonce = randomHexString(6);
    vi.setConfig({ testTimeout: 60000 });
    SEED = `account1${nonce}`;
    const mtt = massTransfer(
      {
        transfers: [{ amount: 0.1 * wvs, recipient: address(SEED, CHAIN_ID) }],
      },
      masterSeed,
    );

    const assetIssue = issue(
      {
        ...issueMinimalParams,
        chainId: CHAIN_ID,
        decimals: 8,
        quantity: 1000000000000,
        reissuable: true,
      },
      masterSeed,
    );

    await broadcast(assetIssue, nodeUrl);
    assetId = assetIssue.id;

    await broadcast(mtt, nodeUrl);
    await waitForTx(mtt.id, { apiBase: nodeUrl, timeout: TIMEOUT });
  }, TIMEOUT);

  it(
    'broadcasts new transactions',
    async () => {
      const _itx = issue(
        {
          chainId: CHAIN_ID,
          description: 'my token',
          name: 'my token',
          quantity: 100000,
          reissuable: true,
        },
        SEED,
      );
      const _ttx = transfer(
        { amount: 10000, recipient: libs.crypto.address(SEED, CHAIN_ID) },
        SEED,
      );
      const _reitx = reissue(
        {
          assetId: assetId,
          chainId: CHAIN_ID,
          quantity: 100,
          reissuable: true,
        },
        SEED,
      );
      const _btx = burn({ amount: 2, assetId: assetId, chainId: CHAIN_ID }, SEED);
      const dtx = data(
        { chainId: CHAIN_ID, data: [{ key: 'foo', type: 'string', value: 'bar' }] },
        SEED,
      );
      const _dtx2delete = data({ chainId: CHAIN_ID, data: [{ key: 'foo' }] }, SEED);
      const _ltx = lease(
        { amount: 1000, recipient: libs.crypto.address(`${SEED}foo`, CHAIN_ID) },
        SEED,
      );
      const _canltx = cancelLease(
        { chainId: CHAIN_ID, leaseId: '6pDDM84arAdJ4Ts7cY7JaDbhjBHMbPdYsr3WyiDSDzbt' },
        SEED,
      );
      const _mttx = massTransfer(
        {
          attachment: '123',
          chainId: CHAIN_ID,
          transfers: [{ amount: 1000, recipient: libs.crypto.address(SEED, CHAIN_ID) }],
        },
        SEED,
      );
      const _atx = alias({ alias: 'super-alias2', chainId: CHAIN_ID }, SEED);
      const _ssTx = setScript(
        {
          additionalFee: 400000,
          chainId: CHAIN_ID,
          //script: 'AwkAAfQAAAADCAUAAAACdHgAAAAJYm9keUJ5dGVzCQABkQAAAAIIBQAAAAJ0eAAAAAZwcm9vZnMAAAAAAAAAAAAIBQAAAAJ0eAAAAA9zZW5kZXJQdWJsaWNLZXmIg5mo',
          script: null,
        },
        SEED,
      );
      const _sastx = setAssetScript(
        {
          assetId: assetId,
          chainId: CHAIN_ID,
          script: 'base64:AwZd0cYf',
        },
        SEED,
      );
      const _spontx = sponsorship(
        {
          assetId: assetId,
          chainId: CHAIN_ID,
          minSponsoredAssetFee: 1000,
        },
        SEED,
      );
      const _istx = invokeScript(
        {
          call: { function: 'foo' },
          chainId: CHAIN_ID,
          dApp: libs.crypto.address(SEED, CHAIN_ID),
        },
        SEED,
      );
      const _uaitx = updateAssetInfo(
        {
          assetId: assetId,
          chainId: CHAIN_ID,
          description: 'new description',
          name: 'new NAme',
        },
        SEED,
      );
      // [ttx, itx, reitx, atx, btx, dtx, ltx, canltx, ssTx, sastx, spontx, istx].forEach(t => {
      //   it(`Broadcasts ${t.type}`, async () => {
      //     try {
      //       await broadcast(t, NODE_URL)
      //
      //     } catch (e) {
      //       console.error(e)
      //     }
      //   })
      // })
      try {
        // await broadcast(ttx, NODE_URL)
        // console.log(itx.id)
        // await broadcast(itx, NODE_URL)
        // await broadcast(reitx, NODE_URL)
        // await broadcast(atx, NODE_URL)
        // await broadcast(btx, NODE_URL)
        await broadcast(dtx, nodeUrl);
        // await broadcast(dtx2delete, NODE_URL)
        // await broadcast(ltx, NODE_URL); console.log(ltx.id)
        // await broadcast(canltx, NODE_URL)
        //   await broadcast(mttx, NODE_URL)
        // await broadcast(ssTx, NODE_URL)
        // console.log(libs.crypto.base64Encode(txToProtoBytes(sastx)))
        // await broadcast(sastx, NODE_URL)
        // await broadcast(spontx, NODE_URL)
        // await broadcast(istx, NODE_URL)
        // await broadcast(uaitx, NODE_URL)
      } catch (e) {
        console.error(e);
      }
    },
    TIMEOUT,
  );

  it('correctly serializes transfers with byte attachments', () => {
    // _a is a v3 transfer fixture whose attachment field is base58-encoded binary data
    // (not a UTF-8 string). This exercises the base58Decode → proto encode → base58Encode
    // round-trip for non-empty byte attachments, distinct from the empty-attachment case
    // already covered by the serialize/deserialize suite.
    const tx = deleteProofsAndId({ ...transferWithByteAttachment });
    const protoBytes = txToProtoBytes(tx as Parameters<typeof txToProtoBytes>[0]);
    const parsed = protoBytesToTx(protoBytes);
    expect(parsed).toMatchObject(tx);
    // Explicit assertion: the binary attachment must survive the proto round-trip intact.
    expect(parsed.attachment).toBe(transferWithByteAttachment.attachment);
  });
});

const transferWithByteAttachment = {
  amount: 500,
  assetId: '9NNLqSE68fimL5GpKFacu67auqtq5aYPVnvWJZJPigNA',
  attachment: '3MyAGEBuZGDKZDzYn6sbh2noqk9uYHy4kjw',
  chainId: 68,
  fee: 100000,
  feeAssetId: null,
  id: '4cYF5ryXtyoXKyTWAjxFm2fnMRuASgfMb1H8SgtaMLrH',
  proofs: [
    '4TjSReiWQRsfqJahn8jLAsw6yhTCqR4fWyE4vFpxKF6WeZoFRehbxE1FocyE8QDtezE6a5Fv1RpK7HJ2rf4WZLfM',
  ],
  recipient: '3FVUWaBpL7DmMWwH3e8S7E8JYVvpihviTDK',
  senderPublicKey: '8rbsYsY3pnPveg13yDcoQ8WrS2tciNQS55rAKcC6gJut',
  timestamp: 1576572672305,
  type: 4,
  version: 3,
};
