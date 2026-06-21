import { broadcast, data, setScript, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { assertAppearsInDataService } from '../helpers/data-service';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

const FUND = 20_000_000; // 0.2 DCC — covers setScript fees + transfers

// ── RIDE sources ──────────────────────────────────────────────────────────────

const ALWAYS_TRUE = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ACCOUNT #-}
true
`.trim();

const TRANSFER_ONLY = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ACCOUNT #-}
match tx {\n  case _: TransferTransaction => true\n  case _ => false\n}
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function scriptInfoOf(addr: string) {
  const res = await fetch(`${API_BASE}addresses/scriptInfo/${addr}`);
  return (await res.json()) as {
    address: string;
    script?: string;
    scriptText?: string;
    complexity: number;
    extraFee: number;
  };
}

describe('SetScript (type 13)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let txId: string;

  it('removes script (script: null) from account', async () => {
    // Setting script to null is always valid and removes any existing script.
    // This avoids needing a RIDE compiler in the test environment.
    const tx = setScript(
      {
        chainId: CHAIN_ID,
        script: null,
      },
      MASTER_SEED,
    );

    txId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('confirms and appears in /v0/transactions/set-script', async () => {
    await assertAppearsInDataService(
      txId,
      `/v0/transactions/set-script?sender=${MASTER_ADDR}&limit=10`,
      API_BASE,
    );
  });

  // ── set always-true verifier script ─────────────────────────────────────────

  it('set always-true verifier script', async () => {
    const wallet = randomTestAccount(CHAIN_ID);
    await fundAccount(wallet.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);

    const compiledB64 = await compileScript(ALWAYS_TRUE, API_BASE);

    const tx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 }, wallet.seed);
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    const info = await scriptInfoOf(wallet.address);
    expect(info.script ?? info.scriptText).toBeTruthy();

    // Cleanup: remove script
    const removeTx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, wallet.seed);
    await broadcast(removeTx, API_BASE);
    await waitForTx(removeTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  });

  // ── smart account with always-true can still send transfers ─────────────────

  it('smart account with always-true can still send transfers', async () => {
    const wallet = randomTestAccount(CHAIN_ID);
    await fundAccount(wallet.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);

    const compiledB64 = await compileScript(ALWAYS_TRUE, API_BASE);

    const setTx = setScript(
      { chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 },
      wallet.seed,
    );
    await broadcast(setTx, API_BASE);
    await waitForTx(setTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const dest = randomTestAccount(CHAIN_ID);
    const transferTx = transfer(
      { amount: 100_000, chainId: CHAIN_ID, fee: 500_000, recipient: dest.address },
      wallet.seed,
    );
    await broadcast(transferTx, API_BASE);
    const confirmed = await waitForTx(transferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    // Cleanup: remove script
    const removeTx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, wallet.seed);
    await broadcast(removeTx, API_BASE);
    await waitForTx(removeTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  });

  // ── transfer-only script blocks data entries ─────────────────────────────────

  it('transfer-only script blocks data entries', async () => {
    const wallet = randomTestAccount(CHAIN_ID);
    await fundAccount(wallet.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);

    const compiledB64 = await compileScript(TRANSFER_ONLY, API_BASE);

    const setTx = setScript(
      { chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 },
      wallet.seed,
    );
    await broadcast(setTx, API_BASE);
    await waitForTx(setTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Data TX must be rejected (script denies non-transfer TX types)
    const dataTx = data(
      {
        chainId: CHAIN_ID,
        data: [{ key: 'should-be-rejected', type: 'integer', value: 1 }],
        fee: 500_000,
      },
      wallet.seed,
    );
    await expect(broadcast(dataTx, API_BASE)).rejects.toThrow();

    // Transfer must succeed (script permits TransferTransaction)
    const dest = randomTestAccount(CHAIN_ID);
    const transferTx = transfer(
      { amount: 100_000, chainId: CHAIN_ID, fee: 500_000, recipient: dest.address },
      wallet.seed,
    );
    await broadcast(transferTx, API_BASE);
    const confirmed = await waitForTx(transferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    // Cleanup: remove script
    // Transfer-only script allows TransferTransaction, so setScript(null) must go via a plain transfer workaround.
    // However, setScript is not a TransferTransaction and will be blocked. We need to fund a separate plain
    // account and send from there — but we cannot remove a script from account A using account B's key.
    // Best-effort: attempt removal; it is expected to fail under the restrictor and is acceptable here.
    try {
      const removeTx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, wallet.seed);
      await broadcast(removeTx, API_BASE);
      await waitForTx(removeTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    } catch {
      /* removal blocked by transfer-only script — wallet is ephemeral, acceptable */
    }
  });
});
