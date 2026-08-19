/**
 * Header — CTA ink contrast across app themes
 *
 * The landing page's canvas is a fixed dark brand surface (`brandInk.night`)
 * regardless of the app-wide light/dark toggle — see LandingPage.tsx and
 * task-5-report.md. Before task 5, `Header` only ever rendered inside its own
 * page's `<ThemeProvider theme={landingTheme}>`, which pinned `primary.main`
 * to a fixed deep indigo (`#3d26be`) no matter what the Settings toggle said.
 *
 * Once the page stopped forcing that wrapper, `Header`'s "Sign up" pill
 * button — `bgcolor: 'common.white'`, `color: 'primary.main'` — started
 * reading `primary.main` from the *real* ambient theme instead. In dark mode
 * that resolves to `tokens('dark').accent.primary` (`#8b7dff`), a light
 * violet tuned to sit on a near-black surface as text, not to serve as ink on
 * a white pill: measured 3.24:1 against white, below the 4.5:1 AA floor
 * (see the ratio recorded next to `accent.primary` in semantic.ts).
 *
 * `Header`'s canvas never changes with the toggle, so its ink should not
 * either — it must stay pinned to a literal that reads on white in every
 * mode, the same way `HeroSection`'s own identical CTA already does
 * (`color: brandInk.deep`).
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import Header from '../Header';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <Header />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Header — "Sign up" pill ink (%s mode)', (mode) => {
  it('clears AA against its own white background in both modes', () => {
    renderIn(mode);
    const button = screen.getByRole('button', { name: 'app.landing.header.signUp' });
    const ink = rgbToHex(getComputedStyle(button).color);
    // The button's own bgcolor is pinned to 'common.white' — verified
    // directly rather than assumed, so a future change to that literal is
    // also caught.
    const bg = rgbToHex(getComputedStyle(button).backgroundColor);
    expect(bg).toBe('#ffffff');
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * Header — mobile hamburger ink contrast (fix round 1)
 *
 * The hamburger `IconButton` had no explicit `color`, so MUI fell back to
 * `action.active` — `rgba(0, 0, 0, 0.54)` in light mode, the app's default —
 * on this bar's pinned night canvas: measured 1.04:1. Not a task-5 regression
 * (it measured the same under the old `landingTheme`), but it is the mobile
 * navigation control, live in the app's default mode: an invisible hamburger
 * means a phone visitor cannot open the menu.
 *
 * Fix: `color="inherit"`, so the button picks up the ink the AppBar already
 * declares instead of duplicating that literal here.
 *
 * Task 11 made the landing render tree follow the toggle, including the
 * `AppBar`'s own `color` (`common.white` when the bar is over the dark hero
 * band or scrolled-dark; `tokens(mode).text.primary` once the canvas itself
 * is light) — this test follows that one edit point automatically rather
 * than needing a second, independent fix.
 */
describe.each(['light', 'dark'] as const)('Header — hamburger icon ink (%s mode)', (mode) => {
  it('clears AA against the bar it sits on, in both modes', () => {
    renderIn(mode);
    const button = screen.getByRole('button', { name: 'app.landing.header.openMenu' });
    const ink = rgbToHex(getComputedStyle(button).color);
    // The unscrolled AppBar is transparent, so it shows whatever canvas sits
    // behind it — `tokens(mode).surface.base`, the same value LandingPage's
    // own canvas now uses (LandingPage.test.tsx). Verified directly rather
    // than trusting a literal.
    const canvas = tokens(mode).surface.base;
    expect(contrastRatio(ink, canvas)).toBeGreaterThanOrEqual(4.5);
  });
});
