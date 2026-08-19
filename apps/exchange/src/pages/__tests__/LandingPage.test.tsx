/**
 * LandingPage — canvas stays the fixed brand identity in both app themes
 *
 * `LandingPage` used to render exclusively inside its own
 * `<ThemeProvider theme={landingTheme}>` (hardcoded `mode: 'light'`).
 * Removing that wrapper (task 5) means the page now inherits whatever theme
 * `ThemeContext` provides — but its own canvas is deliberately pinned to
 * `brandInk.night` rather than `tokens(mode).surface.base`: the render tree
 * beneath it (Header, HeroSection, FeatureBento, SecurityStatement,
 * IconBullets, FaqSection, MarqueeBand, BigCTA, Footer) paints `onCanvas`/
 * `brandCanvas` ink directly on whatever sits behind it, with no per-mode
 * counterpart, and none of those files are in this task's scope. See
 * task-5-report.md for the full rationale.
 *
 * This test pins that the canvas does *not* move with the app-wide toggle —
 * a future accidental `tokens(mode).surface.base` swap would turn most of
 * this page's text invisible in light mode and is caught here, not just by
 * eye. The CTA-ink regression that removing the wrapper *did* introduce
 * (`Header`/`BigCTA`'s "primary.main"-on-white pill) has its own dedicated
 * tests: Header.contrast.test.tsx, BigCTA.contrast.test.tsx.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import LandingPage from '../LandingPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // `MarqueeBand` calls `t(key, { returnObjects: true })` expecting an
    // array; every other call site here wants the key back as a string.
    t: (key: string, opts?: { returnObjects?: boolean }) => (opts?.returnObjects ? [] : key),
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <LandingPage />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('LandingPage canvas (%s mode)', (mode) => {
  it('stays pinned to the fixed brandInk.night canvas regardless of the app theme', () => {
    renderIn(mode);
    const canvas = screen.getByTestId('landing-canvas');
    expect(rgbToHex(getComputedStyle(canvas).backgroundColor)).toBe('#0b0724');
  });

  it('renders the marketing tree without crashing', () => {
    renderIn(mode);
    expect(screen.getByRole('button', { name: 'app.landing.header.signUp' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'app.landing.bigCta.ctaCreate' }),
    ).toBeInTheDocument();
  });
});
