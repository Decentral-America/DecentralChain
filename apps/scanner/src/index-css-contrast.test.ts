/**
 * WCAG AA (4.5:1) for the colour tokens text is drawn in. axe on the live
 * explorer found link text at 3.67:1 on white (102 nodes on /) and muted tab
 * text at 4.34:1 on the muted surface. Contrast is computed from the oklch
 * tokens themselves (OKLab → linear sRGB → relative luminance).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.resolve(import.meta.dirname, 'index.css'), 'utf8');

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf('}', start));
}

function token(scope: string, name: string): [number, number, number] {
  const match = new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`).exec(block(scope));
  if (!match?.[1]) throw new Error(`--${name} not found in ${scope}`);
  const [l, c, h] = match[1].trim().split(/\s+/).map(Number);
  return [l ?? 0, c ?? 0, h ?? 0];
}

function luminance([L, C, h]: [number, number, number]): number {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(fg: [number, number, number], bg: [number, number, number]): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe.each([':root', '.dark'])('%s text tokens', (scope) => {
  it.each([
    ['link', 'background'],
    ['link', 'card'],
    ['link', 'muted'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'muted'],
  ])('--%s on --%s is at least 4.5:1', (fg, bg) => {
    expect(contrast(token(scope, fg), token(scope, bg))).toBeGreaterThanOrEqual(4.5);
  });
});
