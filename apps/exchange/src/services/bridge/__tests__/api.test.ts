/**
 * Bridge API service.
 *
 * Fixtures are trimmed copies of live mainnet responses captured on
 * 29 August 2026, so the field names and the odd shapes below are real rather
 * than assumed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindingLimits,
  getDepositLimits,
  getTokens,
  getTransfer,
  isSettledStatus,
  isUnknownTransfer,
} from '@/services/bridge/api';
import { type BridgeToken, type DepositLimits, type Transfer } from '@/services/bridge/types';

const token = (name: string, overrides: Partial<BridgeToken> = {}): BridgeToken => ({
  assetId: `asset-${name}`,
  dccDecimals: 6,
  divisor: 1,
  enabled: true,
  name,
  solDecimals: 6,
  splMint: `mint-${name}`,
  totalBurned: '0',
  totalMinted: '0',
  ...overrides,
});

const jsonResponse = (body: unknown) =>
  ({
    headers: new Headers(),
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
  }) as unknown as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getTokens', () => {
  it('drops the three assets whose raw limits make them unusable', async () => {
    // All three report enabled:true from the live API — the deposit minimum
    // and maximum are raw values applied uniformly across assets of different
    // decimals, so for these three no realistic amount is accepted on chain.
    fetchMock.mockResolvedValue(
      jsonResponse({
        cacheTtlSeconds: 30,
        contract: '3DhoNpsnwnv4kgnQbjzYxL9MsSo2bQ4qvLH',
        count: 5,
        fetchedAt: 0,
        tokens: [
          token('Bitcoin', { dccDecimals: 8, solDecimals: 8 }),
          token('BONK', { dccDecimals: 5, solDecimals: 5 }),
          token('cbBTC', { dccDecimals: 8, solDecimals: 8 }),
          token('USDC'),
          token('SOL', { dccDecimals: 8, divisor: 10, solDecimals: 9 }),
        ],
      }),
    );

    const result = await getTokens();

    expect(result.map((t) => t.name)).toEqual(['USDC', 'SOL']);
  });

  it('matches the API name field, not a ticker', async () => {
    // The API calls it "Bitcoin". A blocklist of ['BTC'] matches nothing and
    // the asset ships to users.
    fetchMock.mockResolvedValue(
      jsonResponse({
        cacheTtlSeconds: 30,
        contract: '',
        count: 1,
        fetchedAt: 0,
        tokens: [token('Bitcoin')],
      }),
    );

    await expect(getTokens()).resolves.toEqual([]);
  });

  it('drops anything the API marks disabled', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        cacheTtlSeconds: 30,
        contract: '',
        count: 2,
        fetchedAt: 0,
        tokens: [token('PYUSD', { enabled: false }), token('USDT')],
      }),
    );

    const result = await getTokens();

    expect(result.map((t) => t.name)).toEqual(['USDT']);
  });
});

describe('getDepositLimits', () => {
  it('passes the mint as a query parameter', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sources: [] }));

    await getDepositLimits('So11111111111111111111111111111111111111112');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('splMint=So11111111111111111111111111111111111111112'),
      expect.anything(),
    );
  });
});

describe('isUnknownTransfer', () => {
  const placeholder: Transfer = {
    amount: '0',
    amountFormatted: '0 SOL',
    confirmations: 0,
    createdAt: 1788024241255,
    destinationChain: 'dcc',
    destinationTxHash: null,
    error: null,
    estimatedCompletion: null,
    recipient: '',
    requiredConfirmations: 32,
    requiredSignatures: 1,
    sender: '',
    sourceChain: 'solana',
    sourceTxHash: null,
    status: 'pending_confirmation',
    transferId: '0'.repeat(64),
    updatedAt: 1788024241255,
    validatorSignatures: 0,
  };

  it('recognises the placeholder the API returns for an unknown id', async () => {
    // Verified live: GET /transfer/<64 zeros> answers 200 {success:true} with a
    // synthesised pending record rather than 404. Polled naively it is
    // indistinguishable from a real in-flight deposit, so a stale or typo'd id
    // shows a progress bar that never finishes.
    fetchMock.mockResolvedValue(jsonResponse({ success: true, transfer: placeholder }));

    const transfer = await getTransfer('0'.repeat(64));

    expect(transfer.status).toBe('pending_confirmation');
    expect(isUnknownTransfer(transfer)).toBe(true);
  });

  it('does not flag a completed transfer, even with empty metadata', () => {
    // The failure this prevents, seen live: a deposit that had settled
    // reported status "completed" with sender "", amount "0" and
    // sourceTxHash null — byte-for-byte the placeholder shape in every field
    // but the status. Keying off the empty fields alone told the user their
    // completed deposit had never reached the bridge.
    expect(isUnknownTransfer({ ...placeholder, status: 'completed' })).toBe(false);
  });

  it('does not flag a failed transfer', () => {
    expect(isUnknownTransfer({ ...placeholder, status: 'failed' })).toBe(false);
  });

  it('still flags an unknown id, which is never terminal', () => {
    expect(isUnknownTransfer({ ...placeholder, status: 'pending_confirmation' })).toBe(true);
  });

  it('does not flag a real transfer that is genuinely pending', () => {
    expect(
      isUnknownTransfer({
        ...placeholder,
        amount: '1000000000',
        sender: '7xKX...',
        sourceTxHash: '5Nk...',
      }),
    ).toBe(false);
  });
});

describe('bindingLimits', () => {
  it('returns only the limits that will actually stop a deposit', () => {
    // The live response lists six sources for SOL, of which three bind. The
    // daily one is a single counter shared across every token, so a user can
    // be refused for a reasonable amount because someone else spent the budget
    // — reporting "amount too large" there would be wrong.
    const limits = {
      sources: [
        { binding: false, human: '0.001', kind: 'min', raw: '1000000', source: 'solana_program' },
        { binding: true, human: '0.001001', kind: 'min', raw: '1001000', source: 'dcc_contract' },
        { binding: true, human: '10', kind: 'max', raw: '10000000000', source: 'solana_program' },
        { binding: true, human: '50', kind: 'daily', raw: '50000000000', source: 'max_daily_mint' },
      ],
    } as DepositLimits;

    const result = bindingLimits(limits);

    expect(result).toHaveLength(3);
    expect(result.map((s) => s.kind)).toEqual(['min', 'max', 'daily']);
  });
});

describe('isSettledStatus', () => {
  it('treats completed and failed as terminal', () => {
    expect(isSettledStatus('completed')).toBe(true);
    expect(isSettledStatus('failed')).toBe(true);
  });

  it('treats every in-flight state as non-terminal', () => {
    for (const status of ['pending_confirmation', 'pending_signatures', 'processing']) {
      expect(isSettledStatus(status)).toBe(false);
    }
  });
});
