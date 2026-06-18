/**
 * waitForTx — polls the node every 2 s until the transaction is confirmed in a block.
 * Throws if timeoutMs is exceeded.
 */
export async function waitForTx(
  txId: string,
  apiBase: string,
  timeoutMs = 60_000,
): Promise<{ id: string; height: number; [key: string]: unknown }> {
  const deadline = Date.now() + timeoutMs;
  const url = `${apiBase}transactions/info/${txId}`;

  while (Date.now() < deadline) {
    const res = await fetch(url);
    if (res.ok) {
      const tx = (await res.json()) as { id: string; height: number };
      return tx;
    }
    if (res.status !== 404) {
      const body = await res.text();
      throw new Error(`waitForTx: unexpected status ${res.status} — ${body}`);
    }
    // 404 means not yet mined — wait 2 s then retry
    await new Promise((r) => setTimeout(r, 2_000));
  }

  throw new Error(`waitForTx: timeout after ${timeoutMs} ms waiting for tx ${txId}`);
}
