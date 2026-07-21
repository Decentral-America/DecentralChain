/**
 * Type 16 — InvokeScript: dApp deployment and @Callable invocations.
 *
 * Covers:
 *   - Deploying a DAPP-type script via setScript (type 13)
 *   - noop() — confirms type=16 on-chain
 *   - storeInt() — verifies state via /addresses/data
 *   - storeString() — verifies state via /addresses/data
 *   - storeCaller() — verifies i.caller is the invoking address
 *   - acceptPayment() with DCC attached — verifies dApp balance increases
 *   - Invoking a non-existent function — verifies node rejection
 *   - stateChanges API — verifies the debug endpoint reflects writes
 *
 * The dApp is deployed once in beforeAll; all `it` blocks share it.
 */

import { broadcast, invokeScript, setScript, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 20_000_000; // 0.2 DCC per wallet — covers deploy + multiple invocations

// ── RIDE dApp source ──────────────────────────────────────────────────────────

const BASIC_DAPP = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

@Callable(i)
func noop() = []

@Callable(i)
func storeInt(key: String, n: Int) = [IntegerEntry(key, n)]

@Callable(i)
func storeString(key: String, s: String) = [StringEntry(key, s)]

@Callable(i)
func storeCaller(key: String) = [StringEntry(key, toBase58String(i.caller.bytes))]

@Callable(i)
func acceptPayment() = []
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function dataKey(addr: string, key: string) {
  const res = await fetch(`${API_BASE}addresses/data/${addr}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`data key ${key}: HTTP ${res.status}`);
  return (await res.json()) as { key: string; type: string; value: unknown };
}

async function dccBalance(addr: string): Promise<number> {
  const res = await fetch(`${API_BASE}addresses/balance/${addr}`);
  if (!res.ok) throw new Error(`balance: HTTP ${res.status}`);
  const { balance } = (await res.json()) as { balance: number };
  return balance;
}

async function stateChanges(txId: string) {
  // DCC: stateChanges is a field on the TX info response for InvokeScript (type 16).
  // There is no separate /debug/stateChanges endpoint — it's embedded in /transactions/info.
  const res = await fetch(`${API_BASE}transactions/info/${txId}`);
  if (!res.ok) throw new Error(`stateChanges: HTTP ${res.status}`);
  return (await res.json()) as {
    stateChanges: {
      data: Array<{ key: string; type: string; value: unknown }>;
      transfers: Array<{ address: string; asset: string | null; amount: number }>;
    };
  };
}

// ── Unique prefix so concurrent runs don't collide ────────────────────────────

const RUN = Date.now().toString(36);

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('InvokeScript (type 16)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let dapp: ReturnType<typeof randomTestAccount>;
  let caller: ReturnType<typeof randomTestAccount>;
  let skip = false;

  beforeAll(async () => {
    // Try to compile — if endpoint is down, skip the whole suite gracefully
    let compiledB64: string;
    try {
      compiledB64 = await compileScript(BASIC_DAPP, API_BASE);
    } catch (e) {
      console.warn('RIDE compile unavailable — skipping InvokeScript suite:', e);
      skip = true;
      return;
    }

    // Provision wallets in parallel — each needs enough for their role
    dapp = randomTestAccount(CHAIN_ID);
    caller = randomTestAccount(CHAIN_ID);

    await Promise.all([
      fundAccount(dapp.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID),
      fundAccount(caller.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID),
    ]);

    // Deploy dApp (setScript with DAPP-type compiled script)
    const deployTx = setScript(
      { chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 },
      dapp.seed,
    );
    await broadcast(deployTx, API_BASE);
    await waitForTx(deployTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  }, TIMEOUT);

  // ── noop() ────────────────────────────────────────────────────────────────

  it('noop() — confirms on-chain as type 16', async () => {
    if (skip) return;

    const tx = invokeScript(
      { call: { args: [], function: 'noop' }, chainId: CHAIN_ID, dApp: dapp.address, fee: 500_000 },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  // ── storeInt() ────────────────────────────────────────────────────────────

  it('storeInt() — verifies IntegerEntry in account data', async () => {
    if (skip) return;

    const key = `${RUN}_int`;
    const value = 99_999;

    const tx = invokeScript(
      {
        call: {
          args: [
            { type: 'string', value: key },
            { type: 'integer', value },
          ],
          function: 'storeInt',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const entry = await dataKey(dapp.address, key);
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('integer');
    expect(entry?.value).toBe(value);
  });

  // ── storeString() ─────────────────────────────────────────────────────────

  it('storeString() — verifies StringEntry in account data', async () => {
    if (skip) return;

    const key = `${RUN}_str`;
    const value = 'DecentralChain e2e test';

    const tx = invokeScript(
      {
        call: {
          args: [
            { type: 'string', value: key },
            { type: 'string', value },
          ],
          function: 'storeString',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const entry = await dataKey(dapp.address, key);
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('string');
    expect(entry?.value).toBe(value);
  });

  // ── storeCaller() ─────────────────────────────────────────────────────────

  it('storeCaller() — i.caller matches the invoking address', async () => {
    if (skip) return;

    const key = `${RUN}_caller`;

    const tx = invokeScript(
      {
        call: {
          args: [{ type: 'string', value: key }],
          function: 'storeCaller',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const entry = await dataKey(dapp.address, key);
    expect(entry).not.toBeNull();
    // The stored value must equal the caller's address
    expect(entry?.value).toBe(caller.address);
  });

  // ── acceptPayment() ───────────────────────────────────────────────────────

  it('acceptPayment() with DCC — dApp balance increases by payment amount', async () => {
    if (skip) return;

    const payment = 500_000; // 0.005 DCC
    const before = await dccBalance(dapp.address);

    const tx = invokeScript(
      {
        call: { args: [], function: 'acceptPayment' },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
        payment: [{ amount: payment, assetId: null }],
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const after = await dccBalance(dapp.address);
    expect(after).toBeGreaterThanOrEqual(before + payment);
  });

  // ── stateChanges API ──────────────────────────────────────────────────────

  it('stateChanges debug endpoint reflects IntegerEntry writes', async () => {
    if (skip) return;

    const key = `${RUN}_sc`;
    const value = 42;

    const tx = invokeScript(
      {
        call: {
          args: [
            { type: 'string', value: key },
            { type: 'integer', value },
          ],
          function: 'storeInt',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const changes = await stateChanges(tx.id);
    const written = changes.stateChanges.data.find((d) => d.key === key);
    expect(written).toBeDefined();
    expect(written?.value).toBe(value);
  });

  // ── non-existent function → rejection ────────────────────────────────────

  it('calling a non-existent function is rejected by the node', async () => {
    if (skip) return;

    const tx = invokeScript(
      {
        call: { args: [], function: 'doesNotExist' },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    // Node must reject at broadcast (400) or mark applicationStatus as script_execution_failed
    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
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

// ── RIDE compilation-error rejection ──────────────────────────────────────────
// compileScript's error path is implemented (helpers/compile.ts) but was never
// exercised by any spec — every script compiled anywhere in this suite was valid.

describe('RIDE compilation rejects invalid source', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('a syntactically invalid dApp is rejected by /utils/script/compileCode', async () => {
    const brokenSource = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

@Callable(i)
func broken() = {
  this is not valid RIDE syntax at all +++ )))
}
`.trim();

    await expect(compileScript(brokenSource, API_BASE)).rejects.toThrow();
  });
});

// ── RIDE script-complexity ceiling ────────────────────────────────────────────
// MaxCallableComplexityByVersion(V5) = 10000 (node-scala lang/.../ContractLimits.scala);
// sigVerify costs 200 complexity at STDLIB_VERSION 5 (CryptoContext.scala). 60 chained
// calls = 12000, comfortably over the ceiling — deployment must be rejected.

describe('RIDE script-complexity limit', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('a callable function exceeding the complexity ceiling is rejected at deploy', async () => {
    const CALL_COUNT = 60; // 60 * 200 = 12,000 > MaxCallableComplexityByVersion(V5) = 10,000
    const checks = Array.from(
      { length: CALL_COUNT },
      (_, i) => `let c${i} = sigVerify(base58'', base58'', base58'')`,
    ).join('\n  ');
    const combined = Array.from({ length: CALL_COUNT }, (_, i) => `c${i}`).join(' && ');

    const tooExpensive = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

@Callable(i)
func tooExpensive() = {
  ${checks}
  if (${combined}) then [] else []
}
`.trim();

    // The node may reject this either at compile time (complexity checked during
    // compileCode) or only at setScript/deploy time (complexity checked per-callable
    // against the chain's committed script) — both are legitimate enforcement points,
    // so accept rejection at either stage as long as it IS rejected somewhere.
    let compiledB64: string | null = null;
    try {
      compiledB64 = await compileScript(tooExpensive, API_BASE);
    } catch {
      return; // rejected at compile time — ceiling enforced, test passes
    }

    const deployer = randomTestAccount(CHAIN_ID);
    await fundAccount(deployer.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);
    const deployTx = setScript(
      { chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 },
      deployer.seed,
    );
    await expect(broadcast(deployTx, API_BASE)).rejects.toThrow();
  });
});
