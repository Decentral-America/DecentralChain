import { isValidAssetId } from './url';

export interface LogoManifest {
  /** assetId -> inline data URI, for the curated hot set only. */
  hot: Record<string, string>;
  /** Commit sha that tail URLs are pinned to. Empty means "no tail fetches". */
  sha: string;
}

export const EMPTY_MANIFEST: LogoManifest = { hot: {}, sha: '' };

/**
 * Tolerant by design. A malformed manifest yields the empty one, which shows
 * every asset its monogram — the same outcome as a network failure, and a
 * perfectly usable app.
 *
 * Hot entries are required to be `data:` URIs. Accepting an arbitrary URL here
 * would let whoever controls the manifest point an `<img>` at a third-party
 * host on every page load.
 */
export function parseManifest(raw: unknown): LogoManifest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return EMPTY_MANIFEST;

  const { hot, sha } = raw as { hot?: unknown; sha?: unknown };
  if (typeof sha !== 'string' || !sha) return EMPTY_MANIFEST;
  if (typeof hot !== 'object' || hot === null || Array.isArray(hot)) return EMPTY_MANIFEST;

  const clean: Record<string, string> = {};
  for (const [assetId, value] of Object.entries(hot as Record<string, unknown>)) {
    if (!isValidAssetId(assetId)) continue;
    if (typeof value !== 'string' || !value.startsWith('data:image/')) continue;
    clean[assetId] = value;
  }

  return { hot: clean, sha };
}
