/**
 * Shared by the contrast test suite: `getComputedStyle(...).color` reports
 * `rgb(r, g, b)`; `contrastRatio` (in `theme/tokens/semantic.ts`) takes hex
 * only.
 *
 * This used to be the same ~7-line function copy-pasted into 30+ individual
 * `*.contrast.test.tsx` files. Fix round 1 extracted it here: the 32 copies
 * were byte-identical, so consolidating them is mechanical and zero-risk —
 * independent of the alpha-drop question below, which is a *behaviour*
 * decision left exactly as it was (see task-8-report.md, Finding 5). A doc
 * comment duplicated in 32 places was 32 places to keep in sync; a function
 * duplicated in 32 places was the same problem for the code itself.
 *
 * Drops any alpha channel: `.slice(0, 3)` keeps r/g/b and discards a 4th
 * match, so an ink specified with alpha would be measured against its own
 * r/g/b as if fully opaque — overstating its contrast once alpha actually
 * composites onto the background. Every current call site passes an opaque
 * colour, so this is exact today; it remains a structural limitation of
 * this idiom, now documented in the one place it can be fixed later instead
 * of 32.
 */
export function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}
