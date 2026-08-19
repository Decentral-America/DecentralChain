/**
 * LandingPage — canvas follows the app-wide theme toggle (task 11)
 *
 * `LandingPage` used to render exclusively inside its own
 * `<ThemeProvider theme={landingTheme}>` (hardcoded `mode: 'light'`).
 * Removing that wrapper (task 5) left the canvas deliberately pinned to
 * `brandInk.night` rather than `tokens(mode).surface.base`, because the render
 * tree beneath it (Header, HeroSection, FeatureBento, SecurityStatement,
 * IconBullets, FaqSection, MarqueeBand, BigCTA, Footer) painted `onCanvas`/
 * `brandCanvas` ink directly on whatever sat behind it, with no per-mode
 * counterpart — see task-5-report.md.
 *
 * Task 11 converts that render tree, so the canvas now follows `tokens(mode)
 * .surface.base` like every other page. This test asserts the *new*
 * contract — a future regression back to a hardcoded `brandInk.night` fill
 * is caught here, not just by eye. The CTA-ink regression from task 5
 * (`Header`/`BigCTA`'s "primary.main"-on-white pill) has its own dedicated
 * tests: Header.contrast.test.tsx, BigCTA.contrast.test.tsx.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { tokens } from '@/theme/tokens/semantic';
import LandingPage from '../LandingPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // `MarqueeBand` calls `t(key, { returnObjects: true })` expecting an
    // array; every other call site here wants the key back as a string.
    t: (key: string, opts?: { returnObjects?: boolean }) => (opts?.returnObjects ? [] : key),
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <LandingPage />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('LandingPage canvas (%s mode)', (mode) => {
  it('follows tokens(mode).surface.base rather than a fixed brand colour', () => {
    renderIn(mode);
    const canvas = screen.getByTestId('landing-canvas');
    expect(rgbToHex(getComputedStyle(canvas).backgroundColor)).toBe(tokens(mode).surface.base);
  });

  it('renders the marketing tree without crashing', () => {
    renderIn(mode);
    expect(screen.getByRole('button', { name: 'app.landing.header.signUp' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'app.landing.bigCta.ctaCreate' }),
    ).toBeInTheDocument();
  });
});
