/**
 * Block-level wait utilities.
 * Used by update-asset-info and any test that requires a cooldown expressed
 * in block count rather than wall-clock time.
 */

export async function currentHeight(apiBase: string): Promise<number> {
  const res = await fetch(`${apiBase}blocks/height`);
  if (!res.ok) throw new Error(`blocks/height returned ${res.status}`);
  const { height } = (await res.json()) as { height: number };
  return height;
}

/**
 * Resolves when the node's reported height reaches `target`.
 * Polls every `intervalMs` (default 8 s — chosen to avoid hammering the node
 * while staying responsive on a ~40 s avg block time).
 */
export async function waitForHeight(
  target: number,
  apiBase: string,
  intervalMs = 8_000,
): Promise<void> {
  while (true) {
    if ((await currentHeight(apiBase)) >= target) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Resolves after `n` new blocks have been produced since this call.
 */
export async function waitNBlocks(n: number, apiBase: string, intervalMs = 8_000): Promise<void> {
  const start = await currentHeight(apiBase);
  await waitForHeight(start + n, apiBase, intervalMs);
}
