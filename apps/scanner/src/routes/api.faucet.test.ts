// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcast, transfer } = vi.hoisted(() => ({
  broadcast: vi.fn(),
  transfer: vi.fn(() => ({ id: 'TXID' })),
}));
vi.mock('@decentralchain/transactions', () => ({ broadcast, transfer }));
const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock('@/lib/error-logger', () => ({ logError, logWarn: vi.fn() }));

// The route's in-process store, wrapped so a test can make reserve/release throw.
const store = vi.hoisted(() => ({ release: vi.fn(), reserve: vi.fn() }));
vi.mock('@/lib/faucet-reservation', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/faucet-reservation')>();
  return {
    ...real,
    memoryReservations: () => {
      const inner = real.memoryReservations();
      store.reserve.mockImplementation(inner.reserve);
      store.release.mockImplementation(inner.release);
      return store;
    },
  };
});

process.env.DCC_FAUCET_SEED = 'unit test faucet seed';
process.env.DCC_NODE_URL = 'https://node.invalid';
process.env.DCC_CHAIN_ID = '33';
delete process.env.REDIS_URL;

const { action, loader } = await import('./api.faucet');

// Testnet ('!') addresses, plus one mainnet ('?') address.
const A = '31daBZ6v4E4RcwkrSVetg1UiCamFegQgbBh';
const B = '31LfyMt9PfLjzCaMi68Exiu7THjoBvahts9';
const C = '31JHA1sEv9d5bAsUBzgNdAgWtBtACYysTsG';
const D = '31daBZ6v4E4RcwkrSVetg1UiCamFegQgbBi';
const E = '31LfyMt9PfLjzCaMi68Exiu7THjoBvahts8';
const MAINNET = '3DcZHm89byJjfdkHTJ9m89pyeMk8vChDGtD';

const post = (address: string) =>
  action({
    request: new Request('http://scanner.test/api/faucet', {
      body: JSON.stringify({ address }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  });

beforeEach(() => {
  broadcast.mockReset();
  broadcast.mockResolvedValue({});
  logError.mockClear();
});

describe('POST /api/faucet', () => {
  it('pays an address once even when it asks five times at once', async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => post(A)));
    expect(responses.map((r) => r.status).sort()).toEqual([200, 429, 429, 429, 429]);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('does not require a CAPTCHA token', async () => {
    const response = await post(B);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, txId: 'TXID' });
  });

  it('returns a generic error on broadcast failure and lets the address retry', async () => {
    broadcast.mockRejectedValueOnce(new Error('State check failed. Reason: internal detail'));
    const failed = await post(C);
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({
      error: 'Faucet transfer failed. Please try again later.',
    });
    expect((await post(C)).status).toBe(200);
  });

  it('answers 503 without broadcasting when the reservation store fails', async () => {
    store.reserve.mockRejectedValueOnce(new Error('store unavailable'));
    const response = await post(D);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Faucet temporarily unavailable' });
    expect(broadcast).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(expect.any(Error), { context: 'faucet_reserve' });
  });

  it('still answers the generic 502 and logs when releasing after a failed broadcast fails', async () => {
    broadcast.mockRejectedValueOnce(new Error('node down'));
    store.release.mockRejectedValueOnce(new Error('store unavailable'));
    const response = await post(E);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: 'Faucet transfer failed. Please try again later.',
    });
    expect(logError).toHaveBeenCalledWith(expect.any(Error), {
      address: E,
      context: 'faucet_release',
    });
    // The release failed, so the address stays reserved for the window.
    expect((await post(E)).status).toBe(429);
  });

  it('rejects an address from another network before reserving it', async () => {
    const response = await post(MAINNET);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('mainnet');
    expect(broadcast).not.toHaveBeenCalled();
  });
});

describe('GET /api/faucet', () => {
  it('answers 405 and names the allowed method', async () => {
    const response = loader();
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });
});
