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
});
