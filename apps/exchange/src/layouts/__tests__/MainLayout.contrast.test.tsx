/**
 * MainLayout — both-mode shell surfaces
 *
 * The shell every one of the fifteen authenticated routes renders inside. Like
 * `AppTopBar` and `AppLauncher` it had **zero test coverage**, which is how the
 * three of them together shipped a dark mode nobody could read.
 *
 * The specific defect here is a **half-conversion**: the shell's fill was
 * moved to a mode-aware token (`background.paper`) while the hairline drawn
 * around it on the very next line was left as `palette.frost` — `#e5edf5`, a
 * fixed near-white, which in dark mode draws a bright ring around a near-black
 * shell (16.60:1 against the ground it sits on). One branch converted, its
 * sibling not: the pair stopped moving together.
 *
 * The night ground *outside* the shell is deliberately fixed in both modes —
 * it is the brand register the marketing and auth surfaces stand on, and it
 * carries no text of its own. That is asserted below so it cannot be mistaken
 * for the same defect and "fixed" into following the mode.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '@/layouts/MainLayout';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { brandInk } from '@/theme/landingTheme';
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

function renderIn(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <MemoryRouter initialEntries={['/desktop/wallet']}>
        <MainLayout />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

/** The rounded shell: the ancestor of the top bar that paints `surface.raised`. */
function shellOf(header: HTMLElement): HTMLElement {
  const shell = header.parentElement;
  if (!shell) throw new Error('top bar has no shell parent');
  return shell;
}

describe.each(['light', 'dark'] as const)('MainLayout (%s mode)', (mode) => {
  it('paints the shell from a mode-aware surface token', () => {
    renderIn(mode);
    const shell = shellOf(document.querySelector('header') as HTMLElement);
    expect(toHex(getComputedStyle(shell).backgroundColor)).toBe(tokens(mode).surface.raised);
  });

  it('draws the shell hairline from a mode-aware token, not a fixed near-white', () => {
    renderIn(mode);
    const shell = shellOf(document.querySelector('header') as HTMLElement);
    const border = toHex(getComputedStyle(shell).borderTopColor);
    /*
     * A hairline softening the shell's own edge, not a control boundary — so
     * what it must stay quiet against is the surface it edges. Pre-fix,
     * `palette.frost` sat 15.64:1 from the dark shell it was supposed to be
     * edging (and 16.60:1 from the ground), i.e. a bright ring rather than a
     * hairline. Measured against the shell rather than the ground because the
     * ground is deliberately fixed dark in *both* modes: a light-mode
     * hairline is necessarily far from it, and that separation is carried by
     * the shell/ground fill step, not by this line.
     *
     * Ratio first, so a run against the broken source reports the number.
     */
    expect(contrastRatio(border, tokens(mode).surface.raised)).toBeLessThan(3);
    expect(border).toBe(tokens(mode).border.subtle);
  });

  it('keeps the brand ground fixed in both modes, and it carries no ink', () => {
    renderIn(mode);
    const shell = shellOf(document.querySelector('header') as HTMLElement);
    const ground = shell.parentElement as HTMLElement;
    expect(toHex(getComputedStyle(ground).backgroundColor)).toBe(brandInk.night);
    // Nothing is painted directly on it — the shell covers it entirely — so
    // the fixed fill needs no mode-aware ink to answer to.
    expect(ground.childElementCount).toBe(1);
  });

  it('the network tag in the top bar clears AA on the shell', () => {
    renderIn(mode);
    const tag = screen.getByText('mainnet');
    const ink = toHex(getComputedStyle(tag).color);
    const fill = toHex(getComputedStyle(tag).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });
});
