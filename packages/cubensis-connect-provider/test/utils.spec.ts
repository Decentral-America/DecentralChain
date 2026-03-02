import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateFee } from '../src/utils';
import { TRANSACTION_TYPE } from '../src/transaction-type';

describe('calculateFee', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns tx with fee from node API response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ feeAssetId: null, feeAmount: 500000 }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const tx = { type: TRANSACTION_TYPE.INVOKE_SCRIPT, dApp: '3N...' } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result.fee).toBe(500000);
    expect(fetch).toHaveBeenCalledWith(
      'https://node.example.com/transactions/calculateFee',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal) as AbortSignal,
      }),
    );
  });

  it('returns original tx when response is not ok', async () => {
    const mockResponse = { ok: false, json: vi.fn() };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const tx = { type: TRANSACTION_TYPE.INVOKE_SCRIPT, dApp: '3N...' } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('returns original tx when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const tx = { type: TRANSACTION_TYPE.TRANSFER, amount: 100 } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
  });

  it('warns when node URL is not HTTPS', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ feeAssetId: null, feeAmount: 100000 }),
      }),
    );

    const tx = { type: TRANSACTION_TYPE.INVOKE_SCRIPT, dApp: '3N...' } as any;
    await calculateFee('http://insecure-node.example.com', tx);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not HTTPS'));
  });

  it('does not warn when node URL uses HTTPS', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ feeAssetId: null, feeAmount: 100000 }),
      }),
    );

    const tx = { type: TRANSACTION_TYPE.INVOKE_SCRIPT, dApp: '3N...' } as any;
    await calculateFee('https://secure-node.example.com', tx);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes an AbortSignal for timeout support', async () => {
    let receivedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        receivedSignal = init.signal ?? undefined;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ feeAssetId: null, feeAmount: 500000 }),
        });
      }),
    );

    const tx = { type: TRANSACTION_TYPE.INVOKE_SCRIPT, dApp: '3N...' } as any;
    await calculateFee('https://node.example.com', tx);

    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal?.aborted).toBe(false);
  });
});
