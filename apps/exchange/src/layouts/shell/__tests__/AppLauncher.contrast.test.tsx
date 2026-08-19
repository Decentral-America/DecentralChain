/**
 * AppLauncher — both-mode contrast
 *
 * The launcher absorbs the tail of the navigation the top bar cannot wear, so
 * it is reachable from all fifteen authenticated routes. Like `AppTopBar` it
 * had **zero test coverage** before this file, which is how it survived 807
 * green tests while being unreadable in dark mode.
 *
 * Pre-existing code, but this branch made dark mode reachable on these routes,
 * so it now ships broken. Everything here is the one defect class — a
 * mode-invariant fill (`palette.*`, a flat constant table with no mode
 * dimension) under mode-aware ink:
 *
 *   - the dialog paper pinned `palette.shellCanvas` under `text.primary` —
 *     1.0475:1 in dark;
 *   - `LauncherCard`'s `&:hover` pinned `palette.mist` — 1.0424:1;
 *   - the inactive icon plate pinned `palette.periwinkleWash` under
 *     `primary.main` — 2.7073:1;
 *   - the shelf label pinned `palette.steel`.
 *
 * Two of those were **half-conversions** — one branch of a ternary, or one of
 * a rest/hover pair, had been moved to a token while its sibling was left a
 * literal (`bgcolor: active ? 'primary.main' : palette.periwinkleWash`;
 * `bgcolor: 'background.paper'` with a `&:hover` still on `palette.mist`).
 * Both sides are asserted below, so fixing one and not the other cannot pass.
 *
 * Hover is read out of the emitted stylesheet rather than simulated: jsdom
 * does not apply `:hover`, so `userEvent.hover` would measure the rest state
 * and pass on broken code.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppLauncher } from '@/layouts/shell/AppLauncher';
import { LAUNCHER_GROUPS } from '@/layouts/shell/navigation';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function hoverDeclaration(el: HTMLElement, property: 'color' | 'background-color'): string {
  const classes = Array.from(el.classList).map((c) => `.${c}:hover`);
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (!rule.selectorText || !classes.some((c) => rule.selectorText.includes(c))) continue;
      const value = rule.style.getPropertyValue(property);
      if (value) return value.trim();
    }
  }
  throw new Error(`no :hover ${property} rule found for ${el.className}`);
}

/** The path of the first destination, so exactly one card renders active. */
const ACTIVE_PATH = LAUNCHER_GROUPS[0]!.items[0]!.path;
const ACTIVE_LABEL = LAUNCHER_GROUPS[0]!.items[0]!.label;

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
 * The card for a destination.
 *
 * Looked up by label *within a button*, not by text alone: "Markets" is both
 * a shelf title and a card label, so `getByText` matches two nodes.
 */
function cardFor(label: string): HTMLElement {
  const card = screen
    .getAllByText(label)
    .map((el) => el.closest('button'))
    .find(Boolean);
  if (!card) throw new Error(`no launcher card for ${label}`);
  return card as HTMLElement;
}

/** The shelf heading for a group — the `h2`, never a card label. */
function shelfLabel(title: string): HTMLElement {
  return screen.getByRole('heading', { level: 2, name: title });
}

/** A text node inside a specific card, so duplicate labels cannot collide. */
function withinCard(card: HTMLElement, text: string): HTMLElement {
  const node = Array.from(card.querySelectorAll('*')).find((el) => el.textContent === text);
  if (!node) throw new Error(`"${text}" not found inside its card`);
  return node as HTMLElement;
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
    const paper = paperOf(title);
    const ink = toHex(getComputedStyle(title).color);
    const fill = toHex(getComputedStyle(paper).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('every shelf label clears AA against the dialog surface', () => {
    renderLauncher(mode);
    for (const group of LAUNCHER_GROUPS) {
      const label = shelfLabel(group.title);
      const ink = toHex(getComputedStyle(label).color);
      const fill = toHex(getComputedStyle(paperOf(label)).backgroundColor);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('every card label and description clears AA against its own card fill', () => {
    renderLauncher(mode);
    for (const group of LAUNCHER_GROUPS) {
      for (const item of group.items) {
        const card = cardFor(item.label);
        const label = withinCard(card, item.label);
        const fill = toHex(getComputedStyle(card).backgroundColor);
        expect(contrastRatio(toHex(getComputedStyle(label).color), fill)).toBeGreaterThanOrEqual(
          4.5,
        );
        const description = withinCard(card, item.description);
        expect(
          contrastRatio(toHex(getComputedStyle(description).color), fill),
        ).toBeGreaterThanOrEqual(4.5);
        expect(fill).toBe(tokens(mode).surface.raised);
      }
    }
  });

  it('the card keeps both halves of its rest/hover pair mode-aware', () => {
    renderLauncher(mode);
    const card = cardFor(ACTIVE_LABEL);
    const hoverFill = toHex(hoverDeclaration(card, 'background-color'));
    // Every ink the card carries has to survive the hover fill too, not just
    // the resting one — the half that was left behind last time. Nodes that
    // paint their own opaque fill (the icon plate) are excluded: they are read
    // against that fill, not against the card's, and are covered by the icon
    // plate test below.
    const inks = Array.from(card.querySelectorAll('p, span, div')).filter((el) => {
      const bg = getComputedStyle(el as HTMLElement).backgroundColor;
      return !bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
    });
    expect(inks.length).toBeGreaterThan(0);
    for (const el of inks) {
      const ink = getComputedStyle(el as HTMLElement).color;
      if (!ink) continue;
      expect(contrastRatio(toHex(ink), hoverFill)).toBeGreaterThanOrEqual(4.5);
    }
    expect(hoverFill).toBe(tokens(mode).surface.hover);
  });

  it('the icon plate clears the 4.5:1 floor on BOTH branches of its active ternary', () => {
    renderLauncher(mode);
    const cards = LAUNCHER_GROUPS.flatMap((g) => g.items).map((item) => cardFor(item.label));
    const active = cards.filter((c) => c.getAttribute('aria-current') === 'page');
    const inactive = cards.filter((c) => c.getAttribute('aria-current') !== 'page');
    // Both branches must actually be exercised, or this test proves half of
    // what it claims.
    expect(active.length).toBeGreaterThan(0);
    expect(inactive.length).toBeGreaterThan(0);

    for (const card of [...active, ...inactive]) {
      const plate = card.querySelector('[aria-hidden="true"]') as HTMLElement;
      const ink = toHex(getComputedStyle(plate).color);
      const fill = toHex(getComputedStyle(plate).backgroundColor);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the card border is a mode-aware hairline on both branches of its ternary', () => {
    renderLauncher(mode);
    const cards = LAUNCHER_GROUPS.flatMap((g) => g.items).map((item) => cardFor(item.label));
    const t = tokens(mode);
    for (const card of cards) {
      const border = toHex(getComputedStyle(card).borderTopColor);
      const expected =
        card.getAttribute('aria-current') === 'page' ? t.accent.primary : t.border.subtle;
      expect(border).toBe(expected);
    }
  });
});
