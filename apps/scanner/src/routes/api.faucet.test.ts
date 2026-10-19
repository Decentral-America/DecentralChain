// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcast, transfer } = vi.hoisted(() => ({
  broadcast: vi.fn(),
  transfer: vi.fn(() => ({ id: 'TXID' })),
}));
vi.mock('@decentralchain/transactions', () => ({ broadcast, transfer }));
vi.mock('@/lib/error-logger', () => ({ logError: vi.fn() }));

process.env.DCC_FAUCET_SEED = 'unit test faucet seed';
process.env.DCC_NODE_URL = 'https://node.invalid';
process.env.DCC_CHAIN_ID = '33';
delete process.env.REDIS_URL;

const { action, loader } = await import('./api.faucet');

// Real testnet ('!') addresses from the 2026-10-18 live audit; one mainnet ('?') address.
const A = '31daBZ6v4E4RcwkrSVetg1UiCamFegQgbBh';
const B = '31LfyMt9PfLjzCaMi68Exiu7THjoBvahts9';
const C = '31JHA1sEv9d5bAsUBzgNdAgWtBtACYysTsG';
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
