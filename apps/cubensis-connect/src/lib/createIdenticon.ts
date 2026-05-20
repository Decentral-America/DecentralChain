/**
 * Deterministic pixel-grid identicon for blockchain addresses.
 *
 * Drop-in replacement for the abandoned identity-img package.
 * Produces an 8×8 symmetric pixel grid — the same visual language as the
 * Ethereum blockies standard that blockchain users recognise as address avatars.
 *
 * Algorithm:
 *   • xorshift64* PRNG seeded from the lower-cased address string
 *   • 3 HSL colours (background, foreground, accent) derived from the first
 *     random values, ensuring broad hue spread and sufficient contrast
 *   • Left–right mirrored 8×8 cell grid (only the left 4 columns are rolled)
 *   • Rendered as an inline SVG encoded as a Base64 data URL — no canvas API
 *     required, works in both popup and background extension contexts
 *
 * Returns a `data:image/svg+xml;base64,...` URL suitable for `<img src=...>`.
 */

/** xorshift64* PRNG — fast, well-distributed, reproducible. */
function makePrng(seed: string): () => number {
  // Mix all characters into a 32-bit state pair via a Murmur3-like finaliser.
  let lo = 0x12345678 >>> 0;
  let hi = 0x87654321 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    lo = Math.imul(lo ^ seed.charCodeAt(i), 0x9e3779b9) >>> 0;
    hi = Math.imul(hi ^ (lo >>> 16), 0x85ebca6b) >>> 0;
  }
  return (): number => {
    // xorshift with avalanche mixing — keeps values spread across the full u32 range
    let x = lo;
    const y = hi;
    lo = y;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= y ^ (y >>> 5);
    hi = x;
    return (lo + hi) >>> 0;
  };
}

/** Convert HSL (h: 0–360, s: 0–1, l: 0–1) to a 6-digit hex colour. */
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Create a deterministic pixel identicon for `seed` at `size` × `size` pixels.
 * @param seed  Blockchain address (or any string) — normalised to lower-case internally.
 * @param size  Output size in pixels (both width and height).
 * @returns `data:image/svg+xml;base64,...` URL.
 */
export function createIdenticon(seed: string, size: number): string {
  const rng = makePrng(seed.toLowerCase());

  // Derive three colours from independent PRNG draws.
  // Hue offsets chosen so background is always pale, foreground vivid, accent warm.
  const fgHue = rng() % 360;
  const bgHue = (fgHue + 120 + (rng() % 120)) % 360; // 120–240 ° offset → complementary feel
  const sptHue = (fgHue + 60 + (rng() % 60)) % 360; //  60–120 ° offset → analogous accent
  const fg = hslToHex(fgHue, 0.7, 0.45);
  const bg = hslToHex(bgHue, 0.15, 0.93);
  const spt = hslToHex(sptHue, 0.55, 0.62);

  const COLS = 8;
  const ROWS = 8;
  const HALF = Math.ceil(COLS / 2); // 4 — only generate the left half, then mirror

  // Each cell: 0 = background (skip), 1 = foreground, 2 = accent
  const cells: number[] = [];
  for (let i = 0; i < ROWS * HALF; i++) {
    cells.push(rng() % 3);
  }

  // Build SVG rects. Use rounded pixel coordinates to avoid sub-pixel bleed.
  const cs = size / COLS;
  const rects: string[] = [`<rect width="${size}" height="${size}" fill="${bg}"/>`];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const srcCol = col < HALF ? col : COLS - 1 - col; // mirror right half
      const cell = cells[row * HALF + srcCol] ?? 0;
      if (cell === 0) continue; // background — let the base rect show

      const color = cell === 2 ? spt : fg;
      const x = Math.round(col * cs);
      const y = Math.round(row * cs);
      const w = Math.round((col + 1) * cs) - x;
      const h = Math.round((row + 1) * cs) - y;
      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`);
    }
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    ` viewBox="0 0 ${size} ${size}"`,
    ` width="${size}" height="${size}">`,
    rects.join(''),
    `</svg>`,
  ].join('');

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
