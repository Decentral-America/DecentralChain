/**
 * dApp counter and payment tests.
 *
 * Covers the Python test_dapp.py test cases:
 *   - counter()      — increments a per-key integer on each invocation
 *   - accumulate(n)  — adds n to a running total; throws when n < 0
 *   - recordPayment() — persists the attached DCC payment amount
 *   - /utils/script/evaluate — expression evaluation against the deployed dApp
 *
 * The dApp is compiled and deployed once in beforeAll; all `it` blocks share it.
 * The script is removed in afterAll (best-effort cleanup).
 */

import { broadcast, invokeScript, setScript, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 20_000_000; // 0.2 DCC — covers deploy + multiple invocations

// ── RIDE dApp source ──────────────────────────────────────────────────────────

const COUNTER_DAPP = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

@Callable(i)
func counter() = {
  let current = valueOrElse(getInteger(this, "counter"), 0)
  [IntegerEntry("counter", current + 1)]
}

@Callable(i)
func accumulate(n: Int) = {
  if (n < 0)
    then throw("n must be non-negative")
    else {
      let current = valueOrElse(getInteger(this, "total"), 0)
      [IntegerEntry("total", current + n)]
    }
}

@Callable(i)
func recordPayment() = {
  let amount = if (size(i.payments) > 0) then i.payments[0].amount else 0
  [IntegerEntry("lastPayment", amount)]
}
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function dataKey(addr: string, key: string) {
  const res = await fetch(`${API_BASE}addresses/data/${addr}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`data key ${key}: HTTP ${res.status}`);
  return (await res.json()) as { key: string; type: string; value: unknown };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('dApp — counter, accumulate, recordPayment (type 16)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let dapp: ReturnType<typeof randomTestAccount>;
  let caller: ReturnType<typeof randomTestAccount>;
  let skip = false;

  beforeAll(async () => {
    let compiledB64: string;
    try {
      compiledB64 = await compileScript(COUNTER_DAPP, API_BASE);
    } catch (e) {
      console.warn('RIDE compile unavailable — skipping dApp suite:', e);
      skip = true;
      return;
    }

    dapp = randomTestAccount(CHAIN_ID);
    caller = randomTestAccount(CHAIN_ID);

    await Promise.all([
      fundAccount(dapp.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID),
      fundAccount(caller.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID),
    ]);

    const deployTx = setScript(
      { chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 },
      dapp.seed,
    );
    await broadcast(deployTx, API_BASE);
    await waitForTx(deployTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  }, TIMEOUT);

  // ── counter() — initial state ─────────────────────────────────────────────

  it('dApp counter starts at zero', async () => {
    if (skip) return;

    // Before any invocation the key must be absent
    const before = await dataKey(dapp.address, 'counter');
    expect(before).toBeNull();

    // First call: counter goes from absent (0) → 1
    const tx = invokeScript(
      {
        call: { args: [], function: 'counter' },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const entry = await dataKey(dapp.address, 'counter');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('integer');
    expect(entry?.value).toBe(1);
  });

  // ── counter() — repeated calls ────────────────────────────────────────────

  it('counter increments across multiple calls', async () => {
    if (skip) return;

    // The previous test already called counter() once (value === 1).
    // Call it two more times; final value must be 3.
    for (let i = 0; i < 2; i++) {
      const tx = invokeScript(
        {
          call: { args: [], function: 'counter' },
          chainId: CHAIN_ID,
          dApp: dapp.address,
          fee: 500_000,
        },
        caller.seed,
      );
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    }

    const entry = await dataKey(dapp.address, 'counter');
    expect(entry).not.toBeNull();
    expect(entry?.value).toBe(3);
  });

  // ── accumulate() — positive values ───────────────────────────────────────

  it('accumulate positive value', async () => {
    if (skip) return;

    for (const n of [42, 8]) {
      const tx = invokeScript(
        {
          call: {
            args: [{ type: 'integer', value: n }],
            function: 'accumulate',
          },
          chainId: CHAIN_ID,
          dApp: dapp.address,
          fee: 500_000,
        },
        caller.seed,
      );
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    }

    const entry = await dataKey(dapp.address, 'total');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('integer');
    expect(entry?.value).toBe(50);
  });

  // ── accumulate() — negative value rejected ────────────────────────────────

  it('accumulate negative value is rejected', async () => {
    if (skip) return;

    const tx = invokeScript(
      {
        call: {
          args: [{ type: 'integer', value: -1 }],
          function: 'accumulate',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
  });

  // ── recordPayment() ───────────────────────────────────────────────────────

  it('recordPayment records the DCC amount', async () => {
    if (skip) return;

    const payment = 500_000; // 0.005 DCC

    const tx = invokeScript(
      {
        call: { args: [], function: 'recordPayment' },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
        payment: [{ amount: payment, assetId: null }],
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const entry = await dataKey(dapp.address, 'lastPayment');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('integer');
    expect(entry?.value).toBe(payment);
  });

  // ── guarded store — negative rejected (alias test) ────────────────────────

  it('guarded store rejects negative', async () => {
    if (skip) return;

    const tx = invokeScript(
      {
        call: {
          args: [{ type: 'integer', value: -99 }],
          function: 'accumulate',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
  });

  // ── /utils/script/evaluate ────────────────────────────────────────────────

  it('script evaluate endpoint works against this dApp', async () => {
    if (skip) return;

    const res = await fetch(`${API_BASE}utils/script/evaluate/${dapp.address}`, {
      body: JSON.stringify({ expr: '1 + 1' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { result?: { value?: unknown }; error?: number };
    // Node returns { result: { type: "Int", value: 2 } } on success
    expect(body.error).toBeUndefined();
    expect((body.result as { value: unknown }).value).toBe(2);
  });

  // ── cleanup ───────────────────────────────────────────────────────────────

  afterAll(async () => {
    if (skip || !dapp) return;
    try {
      const removeTx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, dapp.seed);
      await broadcast(removeTx, API_BASE);
      await waitForTx(removeTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    } catch {
      /* best-effort */
    }
  }, TIMEOUT);
});
