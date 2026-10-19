/**
 * Advanced transaction types: CommitToGeneration (type 19) and InvokeExpression (type 20).
 *
 * CommitToGeneration: committed generators are exposed by GET /generators/at/{height}; every
 * entry must point at a confirmed type-19 transaction sent by that generator. (Task 18 adds a
 * signed submission that must pass the period and BLS proof-of-possession checks.)
 *
 * InvokeExpression: gated by BlockchainFeatures.ContinuationTransaction (feature 26), which
 * node-scala does not expose, so a correctly built and signed type-20 transaction must be
 * rejected by the activation check and by nothing earlier.
 */

import { broadcast, invokeExpression, setScript, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function currentHeight(): Promise<number> {
  const res = await fetch(`${API_BASE}blocks/height`);
  expect(res.status).toBe(200);
  return ((await res.json()) as { height: number }).height;
}

type CommittedGenerator = { address: string; transactionId: string; balance: number };

async function committedGenerators(height: number): Promise<CommittedGenerator[]> {
  const res = await fetch(`${API_BASE}generators/at/${height}`);
  expect(res.status).toBe(200);
  return (await res.json()) as CommittedGenerator[];
}

async function txInfo<T>(id: string): Promise<T> {
  const res = await fetch(`${API_BASE}transactions/info/${id}`);
  expect(res.status).toBe(200);
  return (await res.json()) as T;
}

type CtgInfo = {
  type: number;
  sender: string;
  height: number;
  endorserPublicKey: string;
  generationPeriodStart: number;
};

// ── CommitToGeneration (Type 19) ──────────────────────────────────────────────

describe('CommitToGeneration (type 19)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('every committed generator at the tip was registered by its own confirmed CommitToGeneration', async () => {
    const generators = await committedGenerators(await currentHeight());
    expect(generators.length).toBeGreaterThan(0);
    for (const generator of generators) {
      const tx = await txInfo<CtgInfo>(generator.transactionId);
      expect(tx.type).toBe(19);
      expect(tx.sender).toBe(generator.address);
      expect(tx.height).toBeGreaterThan(0);
      expect(tx.endorserPublicKey.length).toBeGreaterThan(0);
      expect(tx.generationPeriodStart).toBeGreaterThan(0);
    }
  });

  it('malformed CTG submission is rejected (node validates the BLS key and signature)', async () => {
    const body = {
      endorserPublicKey: '1'.repeat(96),
      fee: 100_000,
      generationPeriodStart: 1,
      proofs: ['1'.repeat(88)],
      senderPublicKey: 'GegVBYKsoCdcBoEnba259Xq9pdkVmUaA2cooyfbdWkVN',
      timestamp: Date.now(),
      type: 19,
      version: 1,
    };
    const res = await fetch(`${API_BASE}transactions/broadcast`, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(400);
  });
});

// ── InvokeExpression (Type 20) ────────────────────────────────────────────────

describe('InvokeExpression (type 20)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('compiles a RIDE expression via /utils/script/compileCode', async () => {
    const compiled = await compileScript(
      [
        '{-# STDLIB_VERSION 5 #-}',
        '{-# CONTENT_TYPE EXPRESSION #-}',
        '{-# SCRIPT_TYPE ACCOUNT #-}',
        'true',
      ].join('\n'),
      API_BASE,
    );
    expect(compiled).toMatch(/^[A-Za-z0-9+/=]{8,}$/);
  });

  it('a well-formed InvokeExpression TX is rejected only by the feature-activation gate', async () => {
    const expression = await compileScript(
      [
        '{-# STDLIB_VERSION 5 #-}',
        '{-# CONTENT_TYPE EXPRESSION #-}',
        '{-# SCRIPT_TYPE ACCOUNT #-}',
        '1 + 1 == 2',
      ].join('\n'),
      API_BASE,
    );

    const account = randomTestAccount(CHAIN_ID);
    await fundAccount(account.address, 10_000_000, MASTER_SEED, API_BASE, CHAIN_ID);

    const tx = invokeExpression({ chainId: CHAIN_ID, expression }, account.seed);
    expect(tx.type).toBe(20);
    expect(tx.proofs[0]).toBeTruthy();

    const res = await fetch(`${API_BASE}transactions/broadcast`, {
      body: JSON.stringify(tx),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: number; message: string };
    expect(body.error).toBe(112); // StateCheckFailed
    expect(body.message).toContain('Continuation Transaction feature has not been activated');
  });

  it('/utils/script/evaluate evaluates an expression against a deployed dApp', async () => {
    const compiled = await compileScript(
      [
        '{-# STDLIB_VERSION 5 #-}',
        '{-# CONTENT_TYPE DAPP #-}',
        '{-# SCRIPT_TYPE ACCOUNT #-}',
        '',
        '@Callable(i)',
        'func noop() = []',
      ].join('\n'),
      API_BASE,
    );

    const dapp = randomTestAccount(CHAIN_ID);
    await fundAccount(dapp.address, 10_000_000, MASTER_SEED, API_BASE, CHAIN_ID);
    const deployTx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: compiled }, dapp.seed);
    await broadcast(deployTx, API_BASE);
    await waitForTx(deployTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const res = await fetch(`${API_BASE}utils/script/evaluate/${dapp.address}`, {
      body: JSON.stringify({ expr: '1 + 1' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result?: { type: string; value: unknown } };
    expect(body.result).toEqual({ type: 'Int', value: 2 });
  });
});
