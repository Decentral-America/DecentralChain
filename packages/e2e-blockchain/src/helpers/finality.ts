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
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`transaction ${txId} was not finalized within ${timeoutMs}ms`);
}
