// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loader } from './api.health';

afterEach(() => vi.unstubAllEnvs());

describe('GET /api/health', () => {
  it('reports ok with the public faucet address and never the seed', async () => {
    vi.stubEnv('DCC_FAUCET_SEED', 'unit test faucet seed');
    vi.stubEnv('DCC_CHAIN_ID', '33');
    const response = loader();
    const text = await response.text();
    const body = JSON.parse(text);
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.faucet.configured).toBe(true);
    expect(body.faucet.address).toMatch(/^31/);
    expect(text).not.toContain('unit test faucet seed');
  });

  it('reports an unconfigured faucet with a null address', async () => {
    vi.stubEnv('DCC_FAUCET_SEED', '');
    const body = await loader().json();
    expect(body).toEqual({ faucet: { address: null, configured: false }, status: 'ok' });
  });
});
