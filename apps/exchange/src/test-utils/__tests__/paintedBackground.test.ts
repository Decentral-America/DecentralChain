import { afterEach, describe, expect, it } from 'vitest';
import { cssColour, resolveCssVars } from '../cssVars';
import { paintedBackground, paintedInk } from '../paintedBackground';

function nest(...backgrounds: string[]): HTMLElement {
  let parent: HTMLElement = document.body;
  for (const bg of backgrounds) {
    const el = document.createElement('div');
    el.style.backgroundColor = bg;
    parent.appendChild(el);
    parent = el;
  }
  return parent;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('resolveCssVars / cssColour', () => {
  it('reads the light values from index.css', () => {
    expect(cssColour('var(--text-primary)', 'light')).toBe('rgb(29, 29, 31)');
    expect(resolveCssVars('var(--text-secondary)', 'light')).toBe('#66666b');
  });

  it('applies the dark overrides', () => {
    expect(cssColour('var(--text-primary)', 'dark')).toBe('rgb(245, 245, 247)');
    expect(cssColour('var(--surface-ground)', 'dark')).toBe('rgb(0, 0, 0)');
  });

  it('fails loudly on a variable index.css does not define', () => {
    expect(() => resolveCssVars('var(--no-such-token)', 'light')).toThrow(/--no-such-token/);
  });
});

describe('paintedBackground', () => {
  it('returns an opaque background exactly as declared', () => {
    expect(paintedBackground(nest('rgb(255, 255, 255)', 'rgb(245, 245, 247)'))).toBe(
      'rgb(245, 245, 247)',
    );
  });

  it('composites translucent layers onto the opaque surface beneath them', () => {
    expect(paintedBackground(nest('rgb(255, 255, 255)', 'rgba(0, 0, 0, 0.5)'))).toBe(
      'rgb(128, 128, 128)',
    );
  });

  it('throws when nothing opaque is painted underneath', () => {
    expect(() => paintedBackground(nest('rgba(0, 0, 0, 0.5)'))).toThrow(/opaque/);
  });

  it('reads a `background:` shorthand holding a variable, for the given mode', () => {
    const el = nest('rgb(255, 255, 255)', 'transparent');
    el.style.background = 'var(--surface-ground)';
    expect(paintedBackground(el, 'dark')).toBe('rgb(0, 0, 0)');
    // Without a mode the variable cannot be resolved, so the layer is skipped.
    expect(paintedBackground(el)).toBe('rgb(255, 255, 255)');
  });

  it('prefers a custom property set on an ancestor over index.css', () => {
    const cell = nest('rgb(255, 255, 255)');
    (cell.parentElement as HTMLElement).style.setProperty('--grouped-cell', 'rgb(44, 44, 46)');
    cell.style.background = 'var(--grouped-cell, var(--surface-canvas))';
    expect(paintedBackground(cell, 'light')).toBe('rgb(44, 44, 46)');
  });

  it('parses the `color(srgb …)` form jsdom gives a color-mix', () => {
    expect(paintedBackground(nest('rgb(255, 255, 255)', 'color(srgb 0 0 0 / 0.5)'))).toBe(
      'rgb(128, 128, 128)',
    );
  });
});

describe('paintedInk', () => {
  it('resolves a variable ink for the requested mode', () => {
    const el = nest('rgb(255, 255, 255)');
    el.style.color = 'var(--text-primary)';
    expect(paintedInk(el, 'dark')).toBe('rgb(245, 245, 247)');
  });
});
