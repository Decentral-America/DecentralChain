import { address } from '@decentralchain/ts-lib-crypto';
import { broadcast, libs, waitForTx } from '../src';
import { protoBytesToTx, txToProtoBytes } from '../src/proto-serialize';
import { alias } from '../src/transactions/alias';
import { burn } from '../src/transactions/burn';
import { cancelLease } from '../src/transactions/cancel-lease';
import { data } from '../src/transactions/data';
import { issue } from '../src/transactions/issue';
import { lease } from '../src/transactions/lease';
import { massTransfer } from '../src/transactions/mass-transfer';
import { reissue } from '../src/transactions/reissue';
import { setScript } from '../src/transactions/set-script';
import { sponsorship } from '../src/transactions/sponsorship';
import { transfer } from '../src/transactions/transfer';
import { txs } from './example-proto-tx';
import { exampleTxs } from './exampleTxs';
import { randomHexString, TIMEOUT } from './integration/config';
import { deleteProofsAndId } from './utils';

const nodeUrl = process.env.DCC_TEST_NODE_URL ?? 'http://localhost:6869/';
const masterSeed = process.env.DCC_TEST_MINER_SEED || 'dcc private node seed with dcc tokens';
const chainIdRaw = process.env.DCC_TEST_CHAIN_ID ?? 'R';
const CHAIN_ID = chainIdRaw.length === 1 ? chainIdRaw.charCodeAt(0) : Number(chainIdRaw);
let SEED = 'abc';
const wvs = 1e8;

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
  vi.setConfig({ testTimeout: 120000 });

  beforeAll(async () => {
    const nonce = randomHexString(6);
    SEED = `account1${nonce}`;
    const mtt = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: [{ amount: 2 * wvs, recipient: address(SEED, CHAIN_ID) }],
      },
      masterSeed,
    );

    await broadcast(mtt, nodeUrl);
    await waitForTx(mtt.id, { apiBase: nodeUrl, timeout: TIMEOUT });
  }, TIMEOUT);

  it(
    'broadcasts new transactions',
    async () => {
      // --- Phase 1: Issue a token owned by SEED (requires 1+ DCC, funded via beforeAll) ---
      const itx = issue(
        {
          chainId: CHAIN_ID,
          description: 'my token',
          name: 'my token',
          quantity: 100000,
          reissuable: true,
        },
        SEED,
      );
      const issueResult = await broadcast(itx, nodeUrl);
      expect(issueResult.id).toBe(itx.id);
      // Must confirm before reissue/burn/sponsor — they validate issuer ownership on-chain
      await waitForTx(itx.id, { apiBase: nodeUrl, timeout: TIMEOUT });

      // --- Phase 2: Transactions that need the issued asset confirmed ---

      // Reissue SEED's own token (NOT assetId from beforeAll — that belongs to masterSeed)
      const reitx = reissue(
        {
          assetId: itx.id,
          chainId: CHAIN_ID,
          quantity: 100,
          reissuable: true,
        },
        SEED,
      );
      const reissueResult = await broadcast(reitx, nodeUrl);
      expect(reissueResult.id).toBe(reitx.id);

      // Burn SEED's own token (SEED holds the supply from issue)
      const btx = burn({ amount: 2, assetId: itx.id, chainId: CHAIN_ID }, SEED);
      const burnResult = await broadcast(btx, nodeUrl);
      expect(burnResult.id).toBe(btx.id);

      // Sponsorship on SEED's own token (only issuer can set sponsorship)
      const spontx = sponsorship(
        {
          assetId: itx.id,
          chainId: CHAIN_ID,
          minSponsoredAssetFee: 1000,
        },
        SEED,
      );
      const sponsorResult = await broadcast(spontx, nodeUrl);
      expect(sponsorResult.id).toBe(spontx.id);

      // --- Phase 3: Transactions that don't need asset ownership ---

      // Transfer DCC to self
      const ttx = transfer({ amount: 10000, recipient: libs.crypto.address(SEED, CHAIN_ID) }, SEED);
      const transferResult = await broadcast(ttx, nodeUrl);
      expect(transferResult.id).toBe(ttx.id);

      // Data transaction
      const dtx = data(
        { chainId: CHAIN_ID, data: [{ key: 'foo', type: 'string', value: 'bar' }] },
        SEED,
      );
      const dataResult = await broadcast(dtx, nodeUrl);
      expect(dataResult.id).toBe(dtx.id);

      // Lease
      const ltx = lease(
        { amount: 1000, chainId: CHAIN_ID, recipient: libs.crypto.address(`${SEED}foo`, CHAIN_ID) },
        SEED,
      );
      const leaseResult = await broadcast(ltx, nodeUrl);
      expect(leaseResult.id).toBe(ltx.id);
      // Must confirm before cancel — can't cancel an unconfirmed lease
      await waitForTx(ltx.id, { apiBase: nodeUrl, timeout: TIMEOUT });

      // Cancel lease — uses the confirmed lease ID from above
      const canltx = cancelLease({ chainId: CHAIN_ID, leaseId: ltx.id }, SEED);
      const cancelLeaseResult = await broadcast(canltx, nodeUrl);
      expect(cancelLeaseResult.id).toBe(canltx.id);

      // Mass transfer
      const mttx = massTransfer(
        {
          attachment: '123',
          chainId: CHAIN_ID,
          transfers: [{ amount: 1000, recipient: libs.crypto.address(SEED, CHAIN_ID) }],
        },
        SEED,
      );
      const massTransferResult = await broadcast(mttx, nodeUrl);
      expect(massTransferResult.id).toBe(mttx.id);

      // Alias — unique per test run
      const nonce = randomHexString(6);
      const atx = alias({ alias: `alias-${nonce}`, chainId: CHAIN_ID }, SEED);
      const aliasResult = await broadcast(atx, nodeUrl);
      expect(aliasResult.id).toBe(atx.id);

      // Set script (null = remove script)
      const ssTx = setScript(
        {
          additionalFee: 400000,
          chainId: CHAIN_ID,
          script: null,
        },
        SEED,
      );
      const setScriptResult = await broadcast(ssTx, nodeUrl);
      expect(setScriptResult.id).toBe(ssTx.id);

      // NOTE: setAssetScript requires the asset to have been issued WITH a script — ours wasn't.
      // NOTE: invokeScript requires a deployed dApp at the target address.
      // NOTE: updateAssetInfo requires Feature 17 + 100,000-block interval after issue.
      // These three are covered by the integration test suite which provisions the required state.
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
