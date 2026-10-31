/**
 * Resolves once `txId` sits at or below the finalized height, i.e. it can no longer be
 * dropped by an orphaned microblock.
 *
 * `waitForTx` resolves as soon as a transaction is visible in the liquid (microblock) state,
 * which the next key block can still discard. A test that snapshots balances right after its
 * setup confirms can then read pre-setup state, and a later "balance changed" wait can fire on
 * the setup being re-mined instead of on the thing under test (exchange.spec 2026-10-11: buyer
 * asset delta read as -50000 instead of +50000).
 */
export async function waitForFinalized(
  txId: string,
  apiBase: string,
  timeoutMs = 300_000,
): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [info, finalized] = await Promise.all([
      fetch(`${apiBase}transactions/info/${txId}`),
      fetch(`${apiBase}blocks/height/finalized`),
    ]);
    if (info.ok && finalized.ok) {
      const { height } = (await info.json()) as { height: number };
      const { height: finalizedHeight } = (await finalized.json()) as { height: number };
      if (height <= finalizedHeight) return height;
    }
    await sleep(2_000);
  }
  throw new Error(`transaction ${txId} was not finalized within ${timeoutMs}ms`);
}

/** Resolves after `ms`. The only sleep primitive in the suite; keep it inside helpers. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Thrown by `pollUntil` when the deadline passes; lets callers tell a timeout from a probe error. */
export class PollTimeoutError extends Error {
  override name = 'PollTimeoutError';
}

/**
 * Polls `probe` every `intervalMs` until it returns a non-undefined value, and throws once
 * `timeoutMs` has elapsed. Every wait on chain state goes through this (or `waitForFinalized`)
 * so each one has an explicit deadline and a failure message that names what was awaited.
 */
export async function pollUntil<T>(
  probe: () => Promise<T | undefined>,
  options: { description: string; timeoutMs: number; intervalMs?: number },
): Promise<T> {
  const { description, timeoutMs, intervalMs = 2_000 } = options;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined) return value;
    if (Date.now() >= deadline) break;
    await sleep(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
  }
  throw new PollTimeoutError(`${description} did not happen within ${timeoutMs}ms`);
}

/**
 * Replacement for `waitForTx` in specs that read balances or state afterwards: resolves only
 * once the transaction is finalized, so the read cannot see liquid state that an orphaned
 * microblock later discards. Throws after `timeoutMs`.
 *
 * Convention: wait for finality on the LAST transaction a test broadcasts before it reads state.
 * Setup transactions earlier in the same test keep `waitForTx` (inclusion is enough for the next
 * broadcast to validate), because a later transaction being final implies every earlier one on
 * the same chain is final too. Finality costs roughly two block intervals per wait, so waiting on
 * every setup transaction would multiply suite time without making any read safer.
 */
export async function waitForFinalTx(
  txId: string,
  apiBase: string,
  timeoutMs: number,
): Promise<{ id: string; height: number }> {
  const height = await waitForFinalized(txId, apiBase, timeoutMs);
  return { height, id: txId };
}
