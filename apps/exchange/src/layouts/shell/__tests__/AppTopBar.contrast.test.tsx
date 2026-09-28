/**
 * AppTopBar — both-mode contrast
 *
 * This is the primary desktop navigation on all fifteen authenticated routes,
 * and until this file existed it had **zero test coverage** — which is how it
 * survived 807 green tests while being unreadable in dark mode.
 *
 * The defects this file was written for were all one class — a
 * **mode-invariant fill under mode-aware ink**:
 *
 *   - the `TabRail` track pinned `palette.shellCanvas` under mode-aware
 *     `text.secondary` — 1.7538:1 in dark, and `1.0475:1` on the `&:hover`
 *     `text.primary`;
 *   - `NetworkTag` pinned `palette.periwinkleWash` under `primary.main` —
 *     2.7073:1 in dark;
 *   - `palette.frost` hairlines on the active pill and the `RoundAction`
 *     outline, fixed near-white against a near-black shell.
 *
 * `palette.*` is a flat constant table with no mode dimension, so it behaves
 * exactly like a hex literal even though it reads like a token.
 *
 * The redesigned bar these guarantees now apply to:
 *
 *   - the bar is a translucent material (`chrome[mode].appBar`) floating over
 *     the ground (`background.default`), so what sits directly on it is
 *     measured against the material composited onto what scrolls beneath it —
 *     the ground, and a card — via `paintedBackground`;
 *   - the tab track is an opaque `surface.sunken` well, and the current tab's
 *     selection is a separate sliding pill (`chrome[mode].thumb`) under the
 *     label rather than a fill on the tab itself;
 *   - the network tag is the premium `StatusPill`: its label takes the tone's
 *     deep ink (`chrome[mode].alert.success.fg`) over a 10% `color-mix` tint
 *     of the tone hue, which `paintedBackground` cannot composite, so the
 *     label is measured against both the bar under the plate and the plate
 *     with its tint laid over (see `plateOver`);
 *   - the round buttons no longer draw an outline, so the outlined variant's
 *     hairline check has nothing left to measure. What replaced it — an
 *     unfilled button whose icon ink sits straight on the bar — is asserted
 *     instead, at rest and hovered.
 *
 * Every render mounts both theme providers, as the app does: the premium
 * components read the styled-components theme and throw without it.
 *
 * Hover states are asserted by resolving the `&:hover` rule out of the
 * emotion stylesheet rather than by simulating a pointer — jsdom does not
 * apply `:hover`, so a `userEvent.hover` here would silently measure the rest
 * state and pass on broken code.
 */
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { AppTopBar, NetworkTag, RoundAction, TabRail } from '@/layouts/shell/AppTopBar';
import { darkTheme, lightTheme } from '@/styles/themes';
import { chrome } from '@/styles/tokens';
import { paintedBackground } from '@/test-utils/paintedBackground';
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

/**
 * A `StatusPill` plate as painted: its tint composited onto the surface under it.
 *
 * The plate is `color-mix(in srgb, <tone hue> 10%, transparent)`. jsdom
 * resolves that to `color(srgb r g b / 0.1)`, a form `paintedBackground` does
 * not parse and so skips as if transparent — it measures the surface under
 * the plate. This reads the plate's own resolved value and lays it over that
 * surface, so the label is also measured against the tint users see. Throws
 * on any other form rather than silently measuring the surface alone.
 */
function plateOver(tag: HTMLElement, under: string): { hue: string; plate: string } {
  const value = getComputedStyle(tag).backgroundColor;
  const m = value.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+) \/ ([\d.]+)\)$/);
  if (!m) throw new Error(`Unexpected plate colour: ${value}`);
  const alpha = Number(m[4]);
  const top = [m[1], m[2], m[3]].map((c) => Math.round(Number(c) * 255));
  const base = [1, 3, 5].map((i) => Number.parseInt(under.slice(i, i + 2), 16));
  const hex = (cs: number[]) => `#${cs.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return {
    hue: hex(top),
    plate: hex(top.map((c, i) => Math.round(c * alpha + (base[i] as number) * (1 - alpha)))),
  };
}

/** Both theme providers, as the app mounts them. */
function Providers({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  return (
    <ThemeProvider theme={createAppTheme(mode)}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeProvider>
  );
}

/**
 * The surfaces that sit beneath the translucent bar: the ground it floats
 * over, and the card surface that scrolls under it.
 */
const beneath = (mode: ThemeMode) =>
  [
    ['ground', tokens(mode).surface.base],
    ['card', tokens(mode).surface.raised],
  ] as const;

/** The whole bar, over `under`, with `actions` in its right-hand zone. */
function renderBar(mode: ThemeMode, under: string, actions: ReactNode) {
  return render(
    <Providers mode={mode}>
      <Box sx={{ bgcolor: under }}>
        <MemoryRouter initialEntries={['/desktop/wallet']}>
          <AppTopBar onOpenLauncher={vi.fn()} actions={actions} />
        </MemoryRouter>
      </Box>
    </Providers>,
  );
}

function renderRail(mode: ThemeMode) {
  return render(
    <Providers mode={mode}>
      {/*
        The ground the bar floats over. The track is an opaque well, so nothing
        beneath it enters these measurements: `paintedBackground` stops there.
      */}
      <Box sx={{ bgcolor: 'background.default' }}>
        <MemoryRouter initialEntries={['/desktop/wallet']}>
          <TabRail onOpenLauncher={vi.fn()} />
        </MemoryRouter>
      </Box>
    </Providers>,
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
    const links = Array.from(track.querySelectorAll('a'));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      if (link.getAttribute('aria-current') === 'page') continue;
      const ink = toHex(getComputedStyle(link).color);
      const fill = toHex(paintedBackground(link));
      expect(fill).toBe(tokens(mode).surface.sunken);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the hovered tab label clears AA against the track', () => {
    renderRail(mode);
    const track = screen.getByRole('navigation', { name: 'Primary' });
    const inactive = Array.from(track.querySelectorAll('a')).find(
      (a) => a.getAttribute('aria-current') !== 'page',
    ) as HTMLElement;
    const fill = toHex(paintedBackground(inactive));
    const ink = toHex(hoverDeclaration(inactive, 'color'));
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('the active tab label clears AA against the raised pill it rides on', () => {
    renderRail(mode);
    const active = screen
      .getByRole('navigation', { name: 'Primary' })
      .querySelector('[aria-current="page"]') as HTMLElement;
    expect(active).not.toBeNull();
    /*
     * The selection is no longer the tab's own fill: it is a separate sliding
     * pill, absolutely positioned across the whole tab beneath the label. The
     * label is its sibling, not its child, so `paintedBackground(label)` would
     * walk past the pill to the track — the pill is measured directly
     * (composited onto the track, should it ever turn translucent).
     */
    const pill = active.querySelector(':scope > [aria-hidden="true"]') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(getComputedStyle(pill).position).toBe('absolute');
    const fill = toHex(paintedBackground(pill));
    expect(fill).toBe(toHex(chrome[mode].thumb));
    // The tab declares the ink its label inherits.
    const ink = toHex(getComputedStyle(active).color);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('the launcher trigger clears AA against the track, at rest and hovered', () => {
    renderRail(mode);
    const trigger = screen.getByRole('button', { name: /everything/i });
    const fill = toHex(paintedBackground(trigger));
    expect(fill).toBe(tokens(mode).surface.sunken);
    expect(contrastRatio(toHex(getComputedStyle(trigger).color), fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(toHex(hoverDeclaration(trigger, 'color')), fill)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe.each(['light', 'dark'] as const)('AppTopBar — NetworkTag (%s mode)', (mode) => {
  it.each(beneath(mode))('its label clears AA on its tinted plate, over the %s', (_, under) => {
    renderBar(mode, under, <NetworkTag network="mainnet" />);
    const tag = screen.getByText('mainnet');
    const ink = toHex(getComputedStyle(tag).color);
    // What the plate sits on: the bar's material composited onto `under`.
    const bar = toHex(paintedBackground(tag));
    // The plate itself: the tone hue's 10% tint laid over the bar.
    const { hue, plate } = plateOver(tag, bar);
    // Ratio first, so a run against broken source reports the number that
    // actually breaks the screen rather than a colour mismatch.
    expect(contrastRatio(ink, plate)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ink, bar)).toBeGreaterThanOrEqual(4.5);
    // The tint's hue is the mode's own success intent, not a fixed literal.
    expect(hue).toBe(tokens(mode).intent.success);
  });
});

describe.each(['light', 'dark'] as const)('AppTopBar — RoundAction (%s mode)', (mode) => {
  it.each(
    beneath(mode),
  )('the unfilled variant clears AA against the bar over the %s, at rest and hovered', (_, under) => {
    /*
     * Replaces the outlined-variant case: the redesign dropped the outline
     * (and with it the hairline that case checked), leaving an unfilled
     * button whose icon ink sits straight on the translucent bar.
     */
    renderBar(
      mode,
      under,
      <RoundAction label="Settings">
        <span>icon</span>
      </RoundAction>,
    );
    const button = screen.getByRole('button', { name: 'Settings' });
    const ink = toHex(getComputedStyle(button).color);
    const bar = toHex(paintedBackground(button));
    expect(contrastRatio(ink, bar)).toBeGreaterThanOrEqual(4.5);
    const hoverInk = toHex(hoverDeclaration(button, 'color'));
    const hoverFill = toHex(hoverDeclaration(button, 'background-color'));
    expect(contrastRatio(hoverInk, hoverFill)).toBeGreaterThanOrEqual(4.5);
  });

  it('the filled variant clears AA at rest and on hover', () => {
    render(
      <Providers mode={mode}>
        <Box sx={{ bgcolor: 'background.default' }}>
          <RoundAction filled label="Account">
            <span>icon</span>
          </RoundAction>
        </Box>
      </Providers>,
    );
    const button = screen.getByRole('button', { name: 'Account' });
    const ink = toHex(getComputedStyle(button).color);
    const fill = toHex(paintedBackground(button));
    expect(fill).toBe(tokens(mode).accent.primary);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    const hoverFill = toHex(hoverDeclaration(button, 'background-color'));
    expect(contrastRatio(ink, hoverFill)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('AppTopBar — the bar itself (%s mode)', (mode) => {
  it("paints the mode's own translucent material, not a fixed literal", () => {
    renderBar(mode, tokens(mode).surface.base, <NetworkTag network="mainnet" />);
    const header = document.querySelector('header') as HTMLElement;
    const declared = getComputedStyle(header).backgroundColor.replace(/\s+/g, '');
    expect(declared).toBe(chrome[mode].appBar.replace(/\s+/g, ''));
  });
});
