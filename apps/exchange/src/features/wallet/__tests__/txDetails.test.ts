/**
 * The reason this module exists is the swap case, so that is the case with the
 * fixture: a real mainnet `swapExactIn` whose payout is made by the pool the
 * router calls, one level below the transaction's own stateChanges. A walk that
 * stops at the top level reports it as money spent and nothing received.
 */
import { describe, expect, it } from 'vitest';
import {
  collectAssetIds,
  decodeAttachment,
  headlineFor,
  movementsFor,
  type NodeTx,
  shortId,
} from '../txDetails';

const ME = '3DSU5XZpttsoZoWE53DwyZ2AQELV25vYL4e';
const POOL = '3DcZHm89byJjfdkHTJ9m89pyeMk8vChDGtD';
const ROUTER = '3Dc9mKvihe2ujkk7co5oA2HnUJ9W1CGQsYg';
const CR_COIN = 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo';

/** Amounts are base units; DCC and CR Coin both carry 8 decimals. */
const fmt = (raw: number, assetId: string | null): string =>
  `${raw / 1e8} ${assetId === CR_COIN ? 'CR Coin' : (assetId ?? 'DCC')}`;

/** TecoBoXvWD15GUz9fkuQPsDvrf8a4KNSwbbpcx4iSLR, trimmed to what is read. */
const swapTx: NodeTx = {
  applicationStatus: 'succeeded',
  call: {
    args: [{ type: 'string', value: 'DCC' }],
    function: 'swapExactIn',
  },
  dApp: ROUTER,
  fee: 900000,
  feeAssetId: null,
  height: 2321420,
  id: 'TecoBoXvWD15GUz9fkuQPsDvrf8a4KNSwbbpcx4iSLR',
  payment: [{ amount: 1000000, assetId: null }],
  sender: ME,
  stateChanges: {
    invokes: [
      {
        call: { function: 'applySwap' },
        dApp: POOL,
        payment: [{ amount: 999580, assetId: null }],
        stateChanges: {
          transfers: [{ address: ME, amount: 471541, asset: CR_COIN }],
        },
      },
    ],
    transfers: [{ address: POOL, amount: 420, asset: null }],
  },
  timestamp: 1788071091867,
  type: 16,
};

describe('movementsFor', () => {
  it('finds the payout a nested invoke made, not just the payment sent', () => {
    const movements = movementsFor(swapTx, ME);

    expect(movements).toEqual([
      { assetId: null, direction: 'out', note: 'Sent with the call', raw: 1000000 },
      { assetId: CR_COIN, direction: 'in', note: 'Paid out by the contract', raw: 471541 },
    ]);
  });

  it('leaves out the transfers the contract made to somebody else', () => {
    // The 420 base units the router forwarded to the pool are the pool's, not
    // this account's — counting them would inflate what the swap cost.
    const movements = movementsFor(swapTx, ME);

    expect(movements.some((movement) => movement.raw === 420)).toBe(false);
  });

  it('reports nothing for an account the transaction never touched', () => {
    expect(movementsFor(swapTx, '3DQixpFqVMALpLnD1w1rc4CFwGofxdzo4wX')).toEqual([]);
  });

  it('reads the same transaction from the pool side without borrowing the payout', () => {
    // The pool takes the router's forwarded fee and pays the trader; neither
    // side's row may show the other's amount.
    expect(movementsFor(swapTx, POOL)).toEqual([
      { assetId: null, direction: 'in', note: 'Paid out by the contract', raw: 420 },
    ]);
  });

  it('gives a transfer a direction that depends on which side you are on', () => {
    const transfer: NodeTx = {
      amount: 100000000,
      assetId: null,
      fee: 100000,
      id: 'EvBgCFjRxC2p3P7eQ6ZpTwua2x91SVW1NQXryMD1R8BU',
      recipient: ME,
      sender: '3DQixpFqVMALpLnD1w1rc4CFwGofxdzo4wX',
      timestamp: 1788047924851,
      type: 4,
    };

    expect(movementsFor(transfer, ME)).toEqual([
      { assetId: null, direction: 'in', raw: 100000000 },
    ]);
    expect(movementsFor(transfer, '3DQixpFqVMALpLnD1w1rc4CFwGofxdzo4wX')).toEqual([
      { assetId: null, direction: 'out', raw: 100000000 },
    ]);
  });

  it('sums only the slices of a mass transfer addressed to you', () => {
    const massTransfer: NodeTx = {
      assetId: null,
      fee: 200000,
      id: 'mass',
      sender: '3DQixpFqVMALpLnD1w1rc4CFwGofxdzo4wX',
      timestamp: 1,
      totalAmount: 300,
      transfers: [
        { amount: 100, recipient: ME },
        { amount: 150, recipient: 'someone-else' },
        { amount: 50, recipient: ME },
      ],
      type: 11,
    };

    expect(movementsFor(massTransfer, ME)).toEqual([{ assetId: null, direction: 'in', raw: 150 }]);
  });

  it('says nothing moved for a type that moves nothing', () => {
    const alias: NodeTx = {
      alias: 'tessssster',
      fee: 100000,
      id: '3VAb8R61DoAHdUbizYLaFw9XnedsYoPSSNLe3ECArDPR',
      sender: ME,
      timestamp: 1788071812343,
      type: 10,
    };

    expect(movementsFor(alias, ME)).toEqual([]);
  });
});

describe('headlineFor', () => {
  it('describes a swap by what was traded, not by the script that ran', () => {
    expect(headlineFor(swapTx, ME, fmt)).toBe('Swapped 0.01 DCC for 0.00471541 CR Coin');
  });

  it('falls back to the function name when the caller received nothing', () => {
    const deposit: NodeTx = { ...swapTx, stateChanges: {} };

    expect(headlineFor(deposit, ME, fmt)).toBe('Paid 0.01 DCC to swapExactIn');
  });

  it('names the counterparty on a transfer', () => {
    const transfer: NodeTx = {
      amount: 100000000,
      assetId: null,
      fee: 100000,
      id: 'x',
      recipient: ME,
      sender: '3DQixpFqVMALpLnD1w1rc4CFwGofxdzo4wX',
      timestamp: 1,
      type: 4,
    };

    expect(headlineFor(transfer, ME, fmt)).toBe('Received 1 DCC from 3DQixp…o4wX');
  });

  it('reads an alias creation back as the alias', () => {
    const alias: NodeTx = {
      alias: 'tessssster',
      fee: 100000,
      id: 'x',
      sender: ME,
      timestamp: 1,
      type: 10,
    };

    expect(headlineFor(alias, ME, fmt)).toBe('Created the alias "tessssster"');
  });

  it('names a type it has no verb for rather than calling it a transaction', () => {
    const sponsorship: NodeTx = { fee: 100000, id: 'x', sender: ME, timestamp: 1, type: 14 };

    expect(headlineFor(sponsorship, ME, fmt)).toBe('Changed sponsorship');
  });
});

describe('collectAssetIds', () => {
  it('reaches assets that only appear inside a nested invoke', () => {
    expect(collectAssetIds(swapTx)).toEqual([CR_COIN]);
  });
});

describe('decodeAttachment', () => {
  it('decodes a base58 attachment to the text somebody typed', () => {
    // base58 of "hello"
    expect(decodeAttachment('Cn8eVZg')).toBe('hello');
  });

  it('returns null for an empty attachment rather than an empty row', () => {
    expect(decodeAttachment('')).toBeNull();
    expect(decodeAttachment(undefined)).toBeNull();
  });

  it('returns null rather than replacement characters for binary', () => {
    expect(decodeAttachment('1111')).toBeNull();
  });
});

describe('shortId', () => {
  it('leaves a value short enough to read alone', () => {
    expect(shortId('DCC')).toBe('DCC');
  });

  it('keeps both ends, which is what people check', () => {
    expect(shortId(ME)).toBe('3DSU5X…YL4e');
  });
});
