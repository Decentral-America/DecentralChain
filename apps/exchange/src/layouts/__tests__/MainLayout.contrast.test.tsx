/**
 * MainLayout — both-mode shell surfaces
 *
 * The shell every one of the fifteen authenticated routes renders inside. Like
 * `AppTopBar` and `AppLauncher` it had **zero test coverage**, which is how the
 * three of them together shipped a dark mode nobody could read.
 *
 * The defect this file was written for was a **half-conversion**: the old
 * floating shell's fill moved to a mode-aware token while the hairline drawn
 * around it was left as `palette.frost` — a fixed near-white that drew a bright
 * ring (16.60:1) around the near-black dark-mode shell. One branch converted,
 * its sibling not: the pair stopped moving together.
 *
 * The redesign made the shell frameless. There is no rounded surface and no
 * hairline around one any more, and the ground is no longer a fixed brand
 * night that only the shell stood on: the ground *is* the application's
 * `background.default`, the top bar floats over it as a translucent material,
 * and routed pages lay their titles and cards directly on it. So the same
 * guarantees now land on different elements:
 *
 *   - the ground follows the mode, and nothing opaque sits between it and the
 *     routed content (the old "shell paints a mode-aware surface");
 *   - the one hairline left — the bar's bottom edge between chrome and
 *     content — is the mode's quiet divider, not a fixed near-white (the old
 *     shell hairline);
 *   - ink placed on the ground clears AA, since the ground now carries ink
 *     (this replaces the old "fixed ground carries no ink" case, which the
 *     redesign inverted);
 *   - the network tag clears AA on the plate it paints, where it sits in the
 *     bar over the ground.
 *
 * Both theme providers are mounted, as the app does: the premium
 * `StatusPill` in the bar reads the styled-components theme.
 */
import { Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '@/layouts/MainLayout';
import { darkTheme, lightTheme } from '@/styles/themes';
import { paintedBackground } from '@/test-utils/paintedBackground';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn(), user: { address: '3P123', name: 'Trader' } }),
}));
vi.mock('@/contexts/ConfigContext', () => ({ useConfig: () => ({ network: 'mainnet' }) }));
vi.mock('@/hooks/useAnalytics', () => ({ usePageTracking: vi.fn() }));
vi.mock('@/hooks/usePerformanceMonitoring', () => ({ useRoutePerformance: vi.fn() }));
vi.mock('@/hooks/useRouteStateTracking', () => ({ useRouteStateTracking: vi.fn() }));
vi.mock('@/components/notifications/TransactionNotificationsMonitor', () => ({
  TransactionNotificationsMonitor: () => null,
}));
vi.mock('@/components/modals/CreateAliasModal', () => ({ CreateAliasModal: () => null }));

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

/**
 * A `StatusPill` plate as painted: its tint composited onto the surface under it.
 *
 * The plate is `color-mix(in srgb, <tone hue> 10%, transparent)`. jsdom
 * resolves that to `color(srgb r g b / 0.1)`, a form `paintedBackground` does
 * not parse and so skips as if transparent — it measures the surface under
 * the plate. This reads the plate's own resolved value and lays it over that
 * surface. Throws on any other form rather than silently measuring the
 * surface alone.
 */
function plateOver(tag: HTMLElement, under: string): string {
  const value = getComputedStyle(tag).backgroundColor;
  const m = value.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+) \/ ([\d.]+)\)$/);
  if (!m) throw new Error(`Unexpected plate colour: ${value}`);
  const alpha = Number(m[4]);
  const base = [1, 3, 5].map((i) => Number.parseInt(under.slice(i, i + 2), 16));
  return `#${[m[1], m[2], m[3]]
    .map((c, i) =>
      Math.round(Math.round(Number(c) * 255) * alpha + (base[i] as number) * (1 - alpha))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * The shell with one routed page in its outlet: a line of the quietest page
 * ink (`text.secondary`), standing in for the titles and captions every page
 * lays directly on the ground.
 */
function renderIn(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <MemoryRouter initialEntries={['/desktop/wallet']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route
                path="/desktop/wallet"
                element={<Typography sx={{ color: 'text.secondary' }}>Routed page copy</Typography>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </StyledThemeProvider>
    </ThemeProvider>,
  );
}

/** The ground: `MainLayout`'s root, which holds the frameless shell. */
function groundOf(): HTMLElement {
  const ground = screen.getByRole('main').parentElement?.parentElement;
  if (!ground) throw new Error('content column has no ground ancestor');
  return ground;
}

describe.each(['light', 'dark'] as const)('MainLayout (%s mode)', (mode) => {
  it('paints the ground from a mode-aware surface token, with nothing opaque over it', () => {
    renderIn(mode);
    const ground = groundOf();
    expect(ground.contains(document.querySelector('header'))).toBe(true);
    expect(toHex(getComputedStyle(ground).backgroundColor)).toBe(tokens(mode).surface.base);
    // No rounded shell surface any more: the content column shows the ground
    // itself — anything painted in between would change this composite.
    expect(toHex(paintedBackground(screen.getByRole('main')))).toBe(tokens(mode).surface.base);
  });

  it('draws the chrome/content hairline from a mode-aware token, not a fixed near-white', () => {
    renderIn(mode);
    const header = document.querySelector('header') as HTMLElement;
    const border = toHex(getComputedStyle(header).borderBottomColor);
    /*
     * With the shell's outline gone, the bar's bottom edge is the one hairline
     * the frame draws. It softens the bar's edge rather than bounding a
     * control, so what it must stay quiet against is the bar it edges — the
     * translucent material as painted over the ground. `palette.frost` in dark
     * mode would sit 15.07:1 from that, a bright rule rather than a hairline
     * (`border.subtle` measures 1.19:1 light / 1.32:1 dark).
     *
     * Ratio first, so a run against broken source reports the number.
     */
    expect(contrastRatio(border, toHex(paintedBackground(header)))).toBeLessThan(3);
    expect(border).toBe(tokens(mode).border.subtle);
  });

  it('routed content sits directly on the ground, and ink there clears AA', () => {
    renderIn(mode);
    /*
     * Replaces "the brand ground is fixed and carries no ink": the redesign
     * turned that around. The ground now follows the mode and every page lays
     * its title, subtitle and section headings straight onto it, so the
     * guarantee is that what the shell paints behind the outlet is the mode's
     * ground and the quietest page ink reads on it.
     */
    const copy = screen.getByText('Routed page copy');
    const ground = toHex(paintedBackground(copy));
    expect(ground).toBe(tokens(mode).surface.base);
    const ink = toHex(getComputedStyle(copy).color);
    // Guard: the line declares its own ink. jsdom's default when nothing is
    // declared is black, which "passes" on the light ground by accident.
    expect(ink).toBe(tokens(mode).text.secondary);
    expect(contrastRatio(ink, ground)).toBeGreaterThanOrEqual(4.5);
  });

  it('the network tag in the top bar clears AA on its plate', () => {
    renderIn(mode);
    const tag = screen.getByText('mainnet');
    const ink = toHex(getComputedStyle(tag).color);
    // Under the plate: the bar's translucent material over the ground.
    const bar = toHex(paintedBackground(tag));
    // The plate: the success hue's 10% tint laid over that.
    expect(contrastRatio(ink, plateOver(tag, bar))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ink, bar)).toBeGreaterThanOrEqual(4.5);
  });
});
