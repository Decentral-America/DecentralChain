import { EMPTY_MANIFEST, type LogoManifest, parseManifest } from './manifest';
import { manifestUrl } from './url';

/**
 * One fetch per repository per session. The promise itself is cached, not just
 * its result, so a page mounting twenty `TokenIcon`s at once issues one request
 * rather than twenty — every icon awaits the same in-flight promise.
 *
 * Keyed by `repo`. A session realistically only ever asks for one, but a cache
 * that takes an argument and ignores it is a trap: the second caller would
 * silently receive the first caller's manifest, and the `sha` it carries pins
 * every tail URL into the wrong repository.
 *
 * ## Freshness
 *
 * We do not control the cache headers, and they are much longer than the
 * design originally assumed. Measured against `cdn.jsdelivr.net` on
 * 2026-08-31, a `@latest` path responds with:
 *
 *     cache-control: public, max-age=604800, s-maxage=43200
 *
 * That is **12 hours at the jsDelivr edge and 7 days in a browser that has
 * already fetched it once** — not the `max-age=300, stale-while-revalidate=86400`
 * this comment used to claim, and there is no `stale-while-revalidate` at all.
 *
 * So a merged logo does not appear "within about five minutes". A visitor who
 * has never loaded the app sees it once the edge entry expires, up to 12 hours;
 * a returning visitor may not see it for up to 7 days, until their own browser
 * cache expires. A hard reload fetches it immediately.
 *
 * That latency is accepted rather than worked around. Every asset without a
 * resolved logo shows its monogram, which is a stable, legible mark — a logo
 * arriving late upgrades a row rather than filling a hole, so the cost of the
 * delay is cosmetic. Defeating the cache would mean a cache-busting query
 * parameter on every session's first paint, trading a real request against a
 * purely additive layer. If the delay ever needs to shrink, the lever is an
 * explicit short-lived ref or a different CDN, not a change here.
 */
const inFlight = new Map<string, Promise<LogoManifest>>();

export function resetManifestCache(): void {
  inFlight.clear();
}

export function loadManifest(repo: string): Promise<LogoManifest> {
  const cached = inFlight.get(repo);
  if (cached !== undefined) return cached;

  const pending = (async () => {
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

  inFlight.set(repo, pending);
  return pending;
}
