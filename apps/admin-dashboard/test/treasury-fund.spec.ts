import { beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcast, massTransfer, waitForTx } = vi.hoisted(() => ({
  broadcast: vi.fn(),
  massTransfer: vi.fn(() => ({ id: 'MT1' })),
  waitForTx: vi.fn(),
}));
vi.mock('@decentralchain/transactions', () => ({ broadcast, massTransfer, waitForTx }));
vi.mock('@decentralchain/ts-lib-crypto', () => ({ address: vi.fn(() => '3Psender') }));
vi.mock('../src/lib/treasuryWallets', () => ({
  generateWallets: vi.fn((count: number) =>
    Array.from({ length: count }, (_, i) => ({ address: `31wallet${i}`, seed: `seed ${i}` })),
  ),
  insertFundedWallets: vi.fn(),
}));
vi.mock('../src/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { signToken } from '../src/lib/auth';
import { action } from '../src/routes/api.treasury.fund';

const NODE = 'https://testnet-node.decentralchain.io';
const SEED = 'one two three four five six seven eight nine ten eleven twelve';

async function fund(user: string | null, body: Record<string, unknown>): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers.cookie = `admin_token=${await signToken(user)}`;
  return action({
    context: {},
    params: {},
    request: new Request('https://admin.test/api/treasury/fund', {
      body: JSON.stringify({
        amountDcc: 0.01,
        chainId: '!',
        count: 2,
        intent: 'fund',
        nodeUrl: NODE,
        senderSeed: SEED,
        ...body,
      }),
      headers,
      method: 'POST',
    }),
  } as never) as Promise<Response>;
}

beforeEach(() => {
  vi.stubEnv('ADMIN_DASHBOARD_ALLOWED_NODE_URLS', NODE);
  vi.stubEnv('ADMIN_DASHBOARD_TREASURY_USERS', 'alice,carol,dave,erin');
  broadcast.mockReset();
  broadcast.mockResolvedValue({});
  waitForTx.mockReset();
  waitForTx.mockResolvedValue({});
});

describe('POST /api/treasury/fund', () => {
  it('requires a session', async () => {
    expect((await fund(null, {})).status).toBe(401);
  });

  it('requires the treasury role', async () => {
    expect((await fund('bob', {})).status).toBe(403);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('refuses a node outside the allowlist', async () => {
    const response = await fund('alice', { nodeUrl: 'http://169.254.169.254' });
    expect(response.status).toBe(400);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('funds through one MassTransfer and reports its id', async () => {
    const response = await fund('carol', { idempotencyKey: 'k-carol' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ errors: [], txIds: ['MT1'] });
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('rate-limits a second fund by the same user within 30 s', async () => {
    expect((await fund('dave', {})).status).toBe(200);
    expect((await fund('dave', {})).status).toBe(429);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('replays an idempotency key without broadcasting again', async () => {
    expect((await fund('erin', { idempotencyKey: 'k-shared' })).status).toBe(200);
    vi.stubEnv('ADMIN_DASHBOARD_TREASURY_USERS', 'alice,carol,dave,erin,frank');
    const replay = await fund('frank', { idempotencyKey: 'k-shared' });
    expect(replay.status).toBe(200);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });
});
