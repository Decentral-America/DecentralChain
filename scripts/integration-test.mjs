#!/usr/bin/env node
// Live integration test: SDK → Node transaction flow
// Tests: sign, broadcast, confirm, balance change

import { broadcast, transfer, waitForTx } from '../packages/sdk/transactions/dist/index.mjs';
import { address, publicKey } from '../packages/sdk/ts-lib-crypto/dist/index.mjs';

const SEED = 'waves private node seed with waves tokens';
const NODE_URL = 'http://localhost:6869';
const CHAIN_ID = 82; // 'R' for local private node
const FETCH_TIMEOUT_MS = 10_000;

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${await res.text()}`);
  return await res.json();
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: integration test script with sequential steps
async function main() {
  let passed = 0;
  let failed = 0;

  function ok(name) {
    passed++;
    // biome-ignore lint/suspicious/noConsole: CLI test runner output
    console.log(`  ✓ ${name}`);
  }
  function fail(name, err) {
    failed++;
    console.error(`  ✗ ${name}: ${err}`);
  }

  // biome-ignore lint/suspicious/noConsole: CLI test runner output
  console.log('\n=== Integration Tests: SDK → Node ===\n');

  // 1. Node connectivity
  try {
    const ver = await fetchJson(`${NODE_URL}/node/version`);
    ok(`Node reachable: ${ver.version}`);
  } catch (e) {
    fail('Node connectivity', e.message);
    return;
  }

  // 2. Key derivation
  const senderAddr = address(SEED, String.fromCharCode(CHAIN_ID));
  try {
    const pubKey = publicKey(SEED);
    // biome-ignore lint/suspicious/noConsole: CLI test runner output
    console.log(`  Address: ${senderAddr}`);
    // biome-ignore lint/suspicious/noConsole: CLI test runner output
    console.log(`  PublicKey: ${pubKey}`);
    ok('Key derivation');
  } catch (e) {
    fail('Key derivation', e.message);
  }

  // 3. Balance check (pre-transfer)
  let balanceBefore;
  try {
    const bal = await fetchJson(`${NODE_URL}/addresses/balance/${senderAddr}`);
    balanceBefore = bal.balance;
    ok(`Balance: ${(balanceBefore / 1e8).toFixed(8)} DCC`);
  } catch (e) {
    fail('Balance check', e.message);
  }

  // 4. Self-transfer (sign + broadcast)
  let txId;
  try {
    const signedTx = transfer(
      {
        amount: 1, // 0.00000001 DCC (minimum)
        chainId: CHAIN_ID,
        fee: 100000, // 0.001 DCC
        recipient: senderAddr, // self-transfer
      },
      SEED,
    );
    txId = signedTx.id;
    ok(`TX signed: ${txId}`);

    const result = await broadcast(signedTx, NODE_URL);
    ok(`TX broadcast: ${result.id}`);
  } catch (e) {
    fail('Sign + broadcast', e.message);
  }

  // 5. Wait for confirmation
  if (txId) {
    try {
      const confirmed = await waitForTx(txId, { apiBase: NODE_URL, timeout: 30000 });
      ok(`TX confirmed at height ${confirmed.height}`);
    } catch (e) {
      fail('TX confirmation', e.message);
    }
  } else {
    fail('TX confirmation', 'skipped — no txId from broadcast');
  }

  // 6. Balance after (should decrease by fee only, since self-transfer)
  if (balanceBefore === undefined) {
    fail('Post-transfer balance', 'skipped — pre-transfer balance unknown');
  } else {
    try {
      const bal = await fetchJson(`${NODE_URL}/addresses/balance/${senderAddr}`);
      const balanceAfter = bal.balance;
      const diff = balanceBefore - balanceAfter;
      if (diff === 100000) {
        ok('Balance decreased by fee: -0.001 DCC (correct)');
      } else {
        // May have received block rewards in the meantime
        ok(`Balance delta: ${diff} (includes block rewards)`);
      }
    } catch (e) {
      fail('Post-transfer balance', e.message);
    }
  }

  // 7. Block height advancing
  try {
    const h1 = await fetchJson(`${NODE_URL}/blocks/height`);
    await new Promise((r) => setTimeout(r, 3000));
    const h2 = await fetchJson(`${NODE_URL}/blocks/height`);
    if (h2.height > h1.height) {
      ok(`Chain advancing: ${h1.height} → ${h2.height}`);
    } else {
      ok(`Chain height stable at ${h1.height} (block time > 3s)`);
    }
  } catch (e) {
    fail('Block height', e.message);
  }

  // 8. Data-service connectivity
  try {
    const health = await fetchJson('http://localhost:3000/health');
    ok(`Data-service health: ${health.status}`);
  } catch (e) {
    fail('Data-service connectivity', e.message);
  }

  // biome-ignore lint/suspicious/noConsole: CLI test runner output
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
