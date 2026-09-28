/**
 * The colour actually painted behind an element, as `rgb(r, g, b)`.
 *
 * Walks up from `el` collecting each ancestor's background until it reaches an
 * opaque one, then composites the translucent layers onto it (source-over),
 * the way the browser paints them. An opaque background comes back exactly as
 * declared, so equality checks against a token still hold.
 *
 * This replaces the per-file `nearestBackground` helpers, which returned the
 * first non-transparent background they met and let `rgbToHex` drop its alpha.
 * That was exact while every surface was opaque (see `rgbToHex.ts`), but the
 * redesign's control materials — segmented tracks, wells, pills — are
 * translucent fills, and measuring `rgba(118, 118, 128, 0.12)` as solid
 * `#767680` reports a contrast the user never sees.
 *
 * Three things jsdom does not do for us, handled here:
 *   - A `background:` shorthand holding `var(...)` (how the premium kit paints
 *     cells, sheets and bars) leaves `backgroundColor` transparent while the
 *     shorthand keeps its text, so the shorthand is read when the longhand is
 *     empty.
 *   - `var(...)` is not substituted. Pass `mode` and it is resolved against the
 *     element's own custom properties first (a sheet sets `--grouped-cell`),
 *     then `index.css`; see `cssVars.ts`.
 *   - `color-mix(...)` comes back as `color(srgb r g b / a)`, which is parsed.
 * A layer that still cannot be read (no `mode` for a `var(...)`, a gradient,
 * an image) is skipped as if transparent, so the measurement falls through to
 * the surface underneath.
 */
import { type ThemeMode } from '@/theme/tokens/semantic';
import { cssColour } from './cssVars';

type Rgba = [number, number, number, number];

const alphaOf = (raw: string | undefined) =>
  raw === undefined ? 1 : raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);

function parse(value: string): Rgba | null {
  const rgb = value.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/,
  );
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alphaOf(rgb[4])];
  // `color-mix(in srgb, ...)` as jsdom serialises it: channels in 0..1.
  const srgb = value.match(
    /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
  );
  if (srgb) {
    return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, alphaOf(srgb[4])];
  }
  return null;
}

const isUnset = (v: string) => !v || v === 'transparent' || v === 'rgba(0, 0, 0, 0)';

function layerOf(node: HTMLElement, mode: ThemeMode | undefined): Rgba | null {
  const style = getComputedStyle(node);
  let value = style.backgroundColor;
  if (isUnset(value)) {
    const shorthand = style.getPropertyValue('background').trim();
    if (isUnset(shorthand) || /gradient\(|url\(/.test(shorthand)) return null;
    value = shorthand;
  }
  if (value.includes('var(')) {
    if (!mode) return null;
    value = cssColour(value, mode, node);
  }
  return parse(value);
}

export function paintedBackground(el: HTMLElement, mode?: ThemeMode): string {
  const layers: Rgba[] = [];
  let node: HTMLElement | null = el;
  while (node) {
    const layer = layerOf(node, mode);
    if (layer && layer[3] > 0) {
      layers.push(layer);
      if (layer[3] >= 1) break;
    }
    node = node.parentElement;
  }
  const base = layers.pop();
  if (!base || base[3] < 1) throw new Error('No ancestor with an opaque background found');
  let [r, g, b] = base;
  for (const [lr, lg, lb, a] of layers.reverse()) {
    r = lr * a + r * (1 - a);
    g = lg * a + g * (1 - a);
    b = lb * a + b * (1 - a);
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** `el`'s text colour as `rgb(...)`, resolving an `index.css` variable for `mode`. */
export function paintedInk(el: HTMLElement, mode: ThemeMode): string {
  return cssColour(getComputedStyle(el).color, mode, el);
}
