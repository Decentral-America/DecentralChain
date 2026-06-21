/**
 * RIDE script compiler — wraps the node's /utils/script/compileCode endpoint.
 *
 * Returns the raw base64 string (without the "base64:" prefix) that the
 * setScript / setAssetScript transaction fields expect.
 *
 * Throws a descriptive error when the endpoint is unavailable or the source
 * has a compilation error — callers must decide whether to skip or fail.
 */

interface CompileCodeResponse {
  script: string; // "base64:<payload>"
  complexity: number;
  extraFee: number;
}

export async function compileScript(source: string, apiBase: string): Promise<string> {
  const resp = await fetch(`${apiBase}utils/script/compileCode`, {
    body: source,
    headers: { 'Content-Type': 'text/plain' },
    method: 'POST',
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`RIDE compile failed (HTTP ${resp.status}): ${body}`);
  }

  const result = (await resp.json()) as CompileCodeResponse;

  if (!result.script) {
    throw new Error(`Compile response missing 'script': ${JSON.stringify(result)}`);
  }

  // Strip "base64:" prefix — the TX field expects raw base64
  return result.script.startsWith('base64:') ? result.script.slice(7) : result.script;
}
