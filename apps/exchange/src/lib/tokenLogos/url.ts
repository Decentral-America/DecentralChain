/**
 * The two URL shapes the exchange knows about.
 *
 * The manifest is `@latest` so a merged logo appears without redeploying the
 * exchange. Tail logos are pinned to a commit sha so they can be cached
 * immutably — an unpinned tail URL would have to be revalidated forever.
 */
const CDN = 'https://cdn.jsdelivr.net/gh';

/**
 * Base58: no `0`, `O`, `I` or `l`. DecentralChain asset ids are 32-44 chars.
 *
 * This is a security boundary, not formatting. The id becomes a path segment,
 * so `../../` would walk out of the repository root.
 */
const ASSET_ID = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidAssetId(id: string): boolean {
  return ASSET_ID.test(id);
}

export function manifestUrl(repo: string): string {
  return `${CDN}/${repo}@latest/manifest.json`;
}

/**
 * `null` means "do not attempt a fetch" — the caller falls back to the
 * monogram, which is the correct outcome for both a malformed id and a
 * manifest that arrived without a sha.
 */
export function logoUrlFor(repo: string, sha: string, assetId: string): string | null {
  if (!sha || !isValidAssetId(assetId)) return null;
  return `${CDN}/${repo}@${sha}/assets/${assetId}/128.webp`;
}
