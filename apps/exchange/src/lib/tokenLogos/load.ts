import { EMPTY_MANIFEST, type LogoManifest, parseManifest } from './manifest';
import { manifestUrl } from './url';

/**
 * One fetch per session. The promise itself is cached, not just its result, so
 * a page mounting twenty `TokenIcon`s at once issues one request rather than
 * twenty — every icon awaits the same in-flight promise.
 *
 * Freshness is the CDN's job: the manifest is served
 * `max-age=300, stale-while-revalidate=86400`, so a merged logo appears within
 * about five minutes and an outage keeps serving the last good copy.
 */
let inFlight: Promise<LogoManifest> | null = null;

export function resetManifestCache(): void {
  inFlight = null;
}

export function loadManifest(repo: string): Promise<LogoManifest> {
  if (inFlight !== null) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch(manifestUrl(repo));
      if (!response.ok) return EMPTY_MANIFEST;
      return parseManifest(await response.json());
    } catch {
      // Offline, blocked, CORS, malformed body — all the same outcome: every
      // asset shows its monogram, which is a perfectly usable app.
      return EMPTY_MANIFEST;
    }
  })();

  return inFlight;
}
