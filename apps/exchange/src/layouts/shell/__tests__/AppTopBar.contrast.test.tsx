/**
 * AppTopBar — both-mode contrast
 *
 * This is the primary desktop navigation on all fifteen authenticated routes,
 * and until this file existed it had **zero test coverage** — which is how it
 * survived 807 green tests while being unreadable in dark mode.
 *
 * The code predates this branch, but the branch is what made dark mode
 * reachable on these routes, so it now ships broken:
 *
 *   - the `TabRail` track pinned `palette.shellCanvas` (`#eef0f3`) under
 *     mode-aware `text.secondary` — 1.7538:1 in dark, and `1.0475:1` on the
 *     `&:hover` `text.primary`;
 *   - `NetworkTag` pinned `palette.periwinkleWash` (`#e8e9ff`) under
 *     `primary.main` — 2.7073:1 in dark;
 *   - `palette.frost` hairlines on the active pill and the `RoundAction`
 *     outline, fixed near-white against a near-black shell.
 *
 * All of them are the same class: a **mode-invariant fill under mode-aware
 * ink**. `palette.*` is a flat constant table with no mode dimension, so it
 * behaves exactly like a hex literal even though it reads like a token.
 *
 * Hover states are asserted by resolving the `&:hover` rule out of the
 * emotion stylesheet rather than by simulating a pointer — jsdom does not
 * apply `:hover`, so a `userEvent.hover` here would silently measure the rest
 * state and pass on broken code.
 */
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AppTopBar, NetworkTag, RoundAction, TabRail } from '@/layouts/shell/AppTopBar';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

/**
 * The colour a `&:hover` rule declares for `el`.
 *
 * jsdom never applies `:hover`, so the only honest way to measure a hover
 * state is to read the rule emotion emitted for this element's own class and
 * pull the declaration out of it. Throws rather than falling back to the rest
 * state: a silent fallback is exactly how a hover regression stays green.
 */
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

/** Nearest ancestor (inclusive) painting an opaque background. */
function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return toHex(bg);
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

function renderRail(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      {/* The shell surface the bar actually sits on. */}
      <Box sx={{ bgcolor: tokens(mode).surface.raised }}>
        <MemoryRouter initialEntries={['/desktop/wallet']}>
          <TabRail onOpenLauncher={vi.fn()} />
        </MemoryRouter>
      </Box>
    </ThemeProvider>,
  );
}

describe.each(['light', 'dark'] as const)('AppTopBar — TabRail (%s mode)', (mode) => {
  it('paints its track from a mode-aware surface token, not a fixed literal', () => {
    renderRail(mode);
    const track = screen.getByRole('navigation', { name: 'Primary' });
    expect(toHex(getComputedStyle(track).backgroundColor)).toBe(tokens(mode).surface.sunken);
  });

  it('every inactive tab label clears AA against the track it sits in', () => {
    renderRail(mode);
    const track = screen.getByRole('navigation', { name: 'Primary' });
    const fill = toHex(getComputedStyle(track).backgroundColor);
    const links = Array.from(track.querySelectorAll('a'));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      if (link.getAttribute('aria-current') === 'page') continue;
      const ink = toHex(getComputedStyle(link).color);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the hovered tab label clears AA against the track', () => {
    renderRail(mode);
    const track = screen.getByRole('navigation', { name: 'Primary' });
    const fill = toHex(getComputedStyle(track).backgroundColor);
    const inactive = Array.from(track.querySelectorAll('a')).find(
      (a) => a.getAttribute('aria-current') !== 'page',
    ) as HTMLElement;
    const ink = toHex(hoverDeclaration(inactive, 'color'));
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('the active tab label clears AA against its own raised pill', () => {
    renderRail(mode);
    const active = screen
      .getByRole('navigation', { name: 'Primary' })
      .querySelector('[aria-current="page"]') as HTMLElement;
    expect(active).not.toBeNull();
    const ink = toHex(getComputedStyle(active).color);
    const fill = nearestBackground(active);
    expect(fill).toBe(tokens(mode).surface.raised);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('the launcher trigger clears AA against the track, at rest and hovered', () => {
    renderRail(mode);
    const track = screen.getByRole('navigation', { name: 'Primary' });
    const fill = toHex(getComputedStyle(track).backgroundColor);
    const trigger = screen.getByRole('button', { name: /everything/i });
    expect(contrastRatio(toHex(getComputedStyle(trigger).color), fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(toHex(hoverDeclaration(trigger, 'color')), fill)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe.each(['light', 'dark'] as const)('AppTopBar — NetworkTag (%s mode)', (mode) => {
  it('its label clears AA against its own tinted plate', () => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <NetworkTag network="mainnet" />
      </ThemeProvider>,
    );
    const tag = screen.getByText('mainnet');
    const ink = toHex(getComputedStyle(tag).color);
    const fill = toHex(getComputedStyle(tag).backgroundColor);
    // Ratio first, so a run against the broken source reports the number that
    // actually breaks the screen rather than a colour mismatch.
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    expect(fill).toBe(tokens(mode).surface.hover);
  });
});

describe.each(['light', 'dark'] as const)('AppTopBar — RoundAction (%s mode)', (mode) => {
  it('the outlined variant clears AA against the shell surface behind it', () => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <Box sx={{ bgcolor: tokens(mode).surface.raised }}>
          <RoundAction label="Settings">
            <span>icon</span>
          </RoundAction>
        </Box>
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: 'Settings' });
    const ink = toHex(getComputedStyle(button).color);
    expect(contrastRatio(ink, tokens(mode).surface.raised)).toBeGreaterThanOrEqual(4.5);
    // The outline is a mode-aware hairline, not a fixed near-white one.
    expect(toHex(getComputedStyle(button).borderTopColor)).toBe(tokens(mode).border.subtle);
  });

  it('the filled variant clears AA at rest and on hover', () => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <RoundAction filled label="Account">
          <span>icon</span>
        </RoundAction>
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: 'Account' });
    const ink = toHex(getComputedStyle(button).color);
    expect(contrastRatio(ink, tokens(mode).accent.primary)).toBeGreaterThanOrEqual(4.5);
    const hoverFill = toHex(hoverDeclaration(button, 'background-color'));
    expect(contrastRatio(ink, hoverFill)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('AppTopBar — the bar itself (%s mode)', (mode) => {
  it('paints the shell surface both modes agree on', () => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <MemoryRouter initialEntries={['/desktop/wallet']}>
          <AppTopBar onOpenLauncher={vi.fn()} actions={<NetworkTag network="mainnet" />} />
        </MemoryRouter>
      </ThemeProvider>,
    );
    const header = document.querySelector('header') as HTMLElement;
    expect(toHex(getComputedStyle(header).backgroundColor)).toBe(tokens(mode).surface.raised);
  });
});
