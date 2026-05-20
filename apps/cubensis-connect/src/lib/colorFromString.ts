/**
 * Deterministic string → CSS hex colour.
 *
 * Drop-in replacement for the abandoned color-hash library (last release Apr 2021).
 * Applies a djb2-based hash, maps the result to an HSL hue with fixed saturation /
 * lightness, and converts to an sRGB hex string — zero dependencies, ~400 bytes
 * minified.
 *
 * Used to generate stable fallback background colours for asset logos when no logo
 * image is available.
 */
export function colorFromString(str: string): string {
  // djb2 hash (XOR variant) — kept as 32-bit unsigned throughout
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (((hash << 5) + hash) ^ str.charCodeAt(i)) >>> 0;
  }

  const hue = hash % 360;
  const s = 0.6; // saturation  60 %
  const l = 0.55; // lightness   55 %

  // HSL → sRGB  (standard formula)
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r: number, g: number, b: number;
  if (hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const hex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
