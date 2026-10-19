import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/treasuryWallets', () => ({ getAllWallets: vi.fn().mockResolvedValue([]) }));
vi.mock('../src/lib/api', () => ({ fetchBalanceDetails: vi.fn() }));
vi.mock('../src/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { signToken } from '../src/lib/auth';
import { loader } from '../src/routes/api.treasury.scan';

async function authed(url: string): Promise<Request> {
  const token = await signToken('scan-user');
  return new Request(url, { headers: { cookie: `admin_token=${token}` } });
}

describe('GET /api/treasury/scan', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_DASHBOARD_ALLOWED_NODE_URLS', 'https://testnet-node.decentralchain.io');
    vi.stubEnv('ADMIN_DASHBOARD_TREASURY_USERS', 'scan-user');
  });

  it('refuses a nodeUrl outside the allowlist (no server-side request to arbitrary hosts)', async () => {
    const response = await loader({
      context: {},
      params: {},
      request: await authed('https://admin.test/api/treasury/scan?nodeUrl=http://169.254.169.254'),
    } as never);
    expect(response.status).toBe(400);
  });

  it('streams for an allowlisted nodeUrl', async () => {
    const response = await loader({
      context: {},
      params: {},
      request: await authed(
        'https://admin.test/api/treasury/scan?nodeUrl=https://testnet-node.decentralchain.io',
      ),
    } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
