/**
 * Resolves the CSS custom properties `src/index.css` defines, for tests.
 *
 * jsdom keeps a declared `var(--text-primary)` as that literal string in
 * `getComputedStyle`, so a component that colours itself through the
 * stylesheet's variables (the redesign's mobile layer and a few premium
 * components do, so dark mode follows `data-theme` without per-component
 * branching) cannot be measured by the contrast suite as-is. This reads the
 * real definitions from `index.css` — the light `:root` block and the
 * `:root[data-theme="dark"]` overrides — and substitutes them the way the
 * browser would for that mode, so the tests measure the values users see
 * rather than a hand-copied table that could drift from the stylesheet.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { type ThemeMode } from '@/theme/tokens/semantic';

const css = readFileSync(path.resolve(import.meta.dirname, '../index.css'), 'utf8');

function declarations(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`index.css has no ${selector} block`);
  const body = css.slice(start, css.indexOf('\n}', start));
  const vars = new Map<string, string>();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(m[1] as string, (m[2] as string).replace(/\s+/g, ' ').trim());
  }
  return vars;
}

const light = declarations(':root');
const dark = new Map([...light, ...declarations(':root[data-theme="dark"]')]);

/**
 * `value` with every `var(--name[, fallback])` substituted for `mode`.
 *
 * Pass the element the value was read from to honour custom properties a
 * component sets on itself or an ancestor (a sheet sets `--grouped-cell` for
 * the lists inside it). jsdom reports those, inherited, through
 * `getPropertyValue`; anything not set there falls back to `index.css`.
 */
export function resolveCssVars(value: string, mode: ThemeMode, el?: Element): string {
  const table = mode === 'dark' ? dark : light;
  const scoped = el ? getComputedStyle(el) : undefined;
  let out = value;
  for (let depth = 0; depth < 10 && out.includes('var('); depth++) {
    out = out.replace(
      /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,
      (_whole, name: string, fallback?: string) => {
        const own = scoped?.getPropertyValue(name).trim();
        const v = own || table.get(name) || fallback?.trim();
        if (v === undefined) throw new Error(`index.css defines no ${name}`);
        return v;
      },
    );
  }
  return out;
}

/** A resolved colour as `rgb(r, g, b)` / `rgba(r, g, b, a)`, whether it was hex or functional. */
export function cssColour(value: string, mode: ThemeMode, el?: Element): string {
  const v = resolveCssVars(value, mode, el);
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return v;
  const h =
    (hex[1] as string).length === 3
      ? [...(hex[1] as string)].map((c) => c + c).join('')
      : (hex[1] as string);
  const n = Number.parseInt(h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
