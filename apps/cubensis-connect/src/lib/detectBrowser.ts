/**
 * Inline browser detection — replaces the abandoned detect-browser package
 * (last release Dec 2021, v5.3.0).
 *
 * Strategy:
 *   1. Prefer navigator.userAgentData (User-Agent Client Hints, Chrome/Edge 93+).
 *   2. Fall back to navigator.userAgent regex parsing for Firefox, Safari, and
 *      older Chromium builds that predate the Client Hints API.
 *
 * Returns the same { name, os, version } shape that detect-browser's detect()
 * returned so call-sites need no changes beyond the import path.
 */
export interface BrowserInfo {
  name: string | undefined;
  os: string | undefined;
  version: string | undefined;
}

// navigator.userAgentData — User-Agent Client Hints API (W3C unofficial draft).
// TypeScript 6 removed this from lib.dom.d.ts (not yet Baseline Widely Available).
// Declared locally to avoid casting noise at every call-site.
interface UABrand {
  readonly brand: string;
  readonly version: string;
}
interface NavigatorUAData {
  readonly brands: readonly UABrand[];
  readonly platform: string;
}

export function detectBrowser(): BrowserInfo {
  // Chrome 93+ / Edge 93+ expose userAgentData; Firefox/Safari return undefined.
  const uad = (navigator as Navigator & { readonly userAgentData?: NavigatorUAData }).userAgentData;

  if (uad != null) {
    // `brands` contains entries like "Google Chrome / 120", "Chromium / 120", "Not.A/Brand / 8".
    // Pick the first entry that is not a placeholder or bare "Chromium".
    const significant = uad.brands.find(
      (b) => !b.brand.startsWith('Not') && b.brand !== 'Chromium',
    );

    const rawBrand = significant?.brand ?? 'Chrome';
    const brandLower = rawBrand.toLowerCase();
    // Normalise to the same names detect-browser returned so analytics dimensions
    // stay consistent.  "Google Chrome" → "chrome", "Microsoft Edge" → "edge-chromium",
    // "Opera" / "OPR" → "opera".  Everything else: lowercase + spaces → hyphens.
    const name = brandLower.includes('edge')
      ? 'edge-chromium'
      : brandLower.includes('opera') || brandLower.includes('opr')
        ? 'opera'
        : brandLower.includes('chrome')
          ? 'chrome'
          : brandLower.replace(/\s+/g, '-');

    return {
      name,
      os: uad.platform !== '' ? uad.platform : undefined,
      version: significant?.version,
    };
  }

  // Fallback: parse navigator.userAgent
  const ua = navigator.userAgent;

  type Rule = { re: RegExp; name: string };
  const rules: Rule[] = [
    { name: 'opera', re: /OPR\/(\d[\d.]*)/ },
    { name: 'edge-chromium', re: /Edg\/(\d[\d.]*)/ },
    { name: 'chrome', re: /Chrome\/(\d[\d.]*)/ },
    { name: 'firefox', re: /Firefox\/(\d[\d.]*)/ },
    { name: 'safari', re: /Version\/(\d[\d.]*).*Safari/ },
  ];

  for (const { re, name } of rules) {
    const match = re.exec(ua);
    if (match?.[1] != null) {
      const os = /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'Mac OS'
          : /Linux/.test(ua)
            ? 'Linux'
            : /Android/.test(ua)
              ? 'Android'
              : /(iPhone|iPad|iPod)/.test(ua)
                ? 'iOS'
                : undefined;
      return { name, os, version: match[1] };
    }
  }

  return { name: undefined, os: undefined, version: undefined };
}
