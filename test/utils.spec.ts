import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRANSACTION_TYPE } from '../src/transaction-type';
import { calculateFee } from '../src/utils';

describe('calculateFee', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns tx with fee from node API response', async () => {
    const mockResponse = {
      json: () => Promise.resolve({ feeAmount: 500000, feeAssetId: null }),
      ok: true,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result.fee).toBe(500000);
    expect(fetch).toHaveBeenCalledWith(
      'https://node.example.com/transactions/calculateFee',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: expect.any(AbortSignal) as AbortSignal,
      }),
    );
  });

  it('returns original tx when response is not ok', async () => {
    const mockResponse = { json: vi.fn(), ok: false };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('returns original tx when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const tx = { amount: 100, type: TRANSACTION_TYPE.TRANSFER } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
  });

  it('warns when node URL is not HTTPS', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: 100000, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    await calculateFee('http://insecure-node.example.com', tx);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not HTTPS'));
  });

  it('does not warn when node URL uses HTTPS', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: 100000, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
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
          json: () => Promise.resolve({ feeAmount: 500000, feeAssetId: null }),
          ok: true,
        });
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    await calculateFee('https://node.example.com', tx);

    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal?.aborted).toBe(false);
  });

  it('returns original tx when feeAmount is negative', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: -100, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });

  it('returns original tx when feeAmount is zero', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: 0, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });

  it('returns original tx when feeAmount is NaN', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: NaN, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });

  it('returns original tx when feeAmount is not a number', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: 'not-a-number', feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });

  it('returns original tx when response body is not an object', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve('invalid'),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });

  it('returns original tx when feeAmount is Infinity', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: Infinity, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });

  it('returns original tx when feeAmount is a float', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ feeAmount: 500000.5, feeAssetId: null }),
        ok: true,
      }),
    );

    const tx = { dApp: '3N...', type: TRANSACTION_TYPE.INVOKE_SCRIPT } as any;
    const result = await calculateFee('https://node.example.com', tx);

    expect(result).toEqual(tx);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fee response'));
  });
});
