/**
 * AppLauncher — the grid, in both modes.
 *
 * The previous version of this file asserted against a card/plate anatomy that
 * no longer exists: a `surface.raised` card fill, a rest/hover pair on that
 * card, an icon plate whose colour flipped on an active ternary, and shelf
 * headings. Tiles replace all of it, so this is a rewrite rather than an edit.
 *
 * What carries forward is the reason the file exists: this dialog is reachable
 * from all fifteen authenticated routes and had no coverage at all until a
 * mode-invariant fill made it unreadable in dark mode. Per-tile contrast lives
 * in `AppTile.test.tsx`; what is asserted here is the dialog's own ground and
 * that every destination is actually reachable.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppLauncher } from '@/layouts/shell/AppLauncher';
import { LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

/** The first tile's path, so exactly one destination renders as current. */
const ACTIVE_PATH = LAUNCHER_TILES[0]!.path;

function renderLauncher(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AppLauncher open onClose={vi.fn()} pathname={ACTIVE_PATH} />
    </ThemeProvider>,
  );
}

function paperOf(el: HTMLElement): HTMLElement {
  return el.closest('.MuiDialog-paper') as HTMLElement;
}

/**
 * Every value a property is given for `el`'s own emotion class across the
 * stylesheet's `@media` blocks — jsdom does not apply them, so this reads the
 * rule text instead of trusting `getComputedStyle`. See the call site.
 */
function mediaDeclarations(el: HTMLElement, property: string): string[] {
  const ownClass = Array.from(el.classList).find((c) => c.startsWith('css-'));
  const values: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSMediaRule)) continue;
      for (const inner of Array.from(rule.cssRules) as CSSStyleRule[]) {
        if (inner.selectorText !== `.${ownClass}`) continue;
        const value = inner.style.getPropertyValue(property);
        if (value) values.push(value);
      }
    }
  }
  return values;
}

describe.each(['light', 'dark'] as const)('AppLauncher (%s mode)', (mode) => {
  it('paints its dialog surface from a mode-aware token', () => {
    renderLauncher(mode);
    const paper = paperOf(screen.getByText('Everything'));
    expect(toHex(getComputedStyle(paper).backgroundColor)).toBe(tokens(mode).surface.base);
  });

  it('the dialog title clears AA against the surface it sits on', () => {
    renderLauncher(mode);
    const title = screen.getByText('Everything');
    const ink = toHex(getComputedStyle(title).color);
    const fill = toHex(getComputedStyle(paperOf(title)).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('every tile label clears AA against the dialog surface', () => {
    renderLauncher(mode);
    for (const destination of LAUNCHER_TILES) {
      const label = screen.getByText(destination.label);
      const ink = toHex(getComputedStyle(label).color);
      const fill = toHex(getComputedStyle(paperOf(label)).backgroundColor);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('every tile plate clears AA between its own glyph and fill', () => {
    renderLauncher(mode);
    const plates = Array.from(document.querySelectorAll('.app-tile__plate'));
    expect(plates).toHaveLength(LAUNCHER_TILES.length);
    for (const plate of plates) {
      const style = getComputedStyle(plate as HTMLElement);
      expect(
        contrastRatio(toHex(style.color), toHex(style.backgroundColor)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('AppLauncher grid', () => {
  it('renders every destination exactly once', () => {
    renderLauncher('light');
    for (const destination of LAUNCHER_TILES) {
      expect(screen.getByRole('button', { name: destination.label })).toBeInTheDocument();
    }
  });

  it('marks exactly one tile as the current page', () => {
    renderLauncher('light');
    const current = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(LAUNCHER_TILES[0]!.label);
  });

  it('pins its columns rather than letting auto-fill choose them', () => {
    renderLauncher('light');
    const grid = document.querySelector('[data-testid="launcher-grid"]') as HTMLElement;
    // The hue arrangement is only verified at 3, 4 and 7 columns
    // (navigation.test.ts). `auto-fill` would also produce 5, 6 and 8 at
    // intermediate widths, each of which puts a repeated hue beside its twin.
    //
    // Read from the stylesheet rather than `getComputedStyle`: jsdom's media
    // evaluator only recognises the plain "screen"/"all" media types (see
    // jsdom's `MediaList-impl.js`), so every breakpoint entry MUI emits here —
    // `xs` included, since `sx` wraps even the smallest breakpoint in
    // `@media (min-width:0px)` — is invisible to the computed style. Rule text
    // is the only place all three declarations are visible in this
    // environment.
    const columns = mediaDeclarations(grid, 'grid-template-columns');
    expect(columns).toHaveLength(3);
    for (const value of columns) {
      expect(value).toContain('repeat(');
      expect(value).not.toContain('auto-fill');
      expect(value).not.toContain('auto-fit');
    }
  });
});
