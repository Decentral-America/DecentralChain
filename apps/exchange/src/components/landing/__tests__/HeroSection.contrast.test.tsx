/**
 * HeroSection — ink contrast across app themes (task 11)
 *
 * Dark mode keeps the fixed indigo band (`heroGradientStyles`) the section
 * was art-directed for — its ink (`onCanvas.*`) is measured against the
 * gradient's own stops directly in this file, not through `tokens('dark')`,
 * per the "fixed fill needs fixed ink" rule: a `tokens(mode)`-driven ink
 * paired with a fixed gradient would break the moment the app theme (not the
 * gradient) changed.
 *
 * Light mode drops the fixed band — `AuroraField`/`BandTexture` are
 * dark-only by design (see AuroraField.tsx) and do not render — and paints
 * everything with `tokens('light')`, verified against the page canvas
 * (`tokens('light').surface.base`, the same value LandingPage's own canvas
 * uses) the way `SignUp.canvasContrast.test.tsx` verifies text painted
 * directly on `AuthScene`.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import HeroSection from '../HeroSection';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <HeroSection />
    </ThemeProvider>,
  );

/** The lightest stop of `brandGradient.heroField` — the hardest point for light-on-dark ink. */
const HERO_GRADIENT_LIGHTEST_STOP = '#2a1263';

describe('HeroSection — eyebrow ink', () => {
  it('dark mode clears AA against the hero gradient’s lightest stop', () => {
    renderIn('dark');
    const ink = rgbToHex(getComputedStyle(screen.getByText('app.landing.hero.eyebrow')).color);
    expect(contrastRatio(ink, HERO_GRADIENT_LIGHTEST_STOP)).toBeGreaterThanOrEqual(4.5);
  });

  it('light mode clears AA against the page canvas', () => {
    renderIn('light');
    const ink = rgbToHex(getComputedStyle(screen.getByText('app.landing.hero.eyebrow')).color);
    expect(contrastRatio(ink, tokens('light').surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('HeroSection — subhead ink', () => {
  it('dark mode clears AA against the hero gradient’s lightest stop', () => {
    renderIn('dark');
    const ink = rgbToHex(getComputedStyle(screen.getByText('app.landing.hero.subhead')).color);
    expect(contrastRatio(ink, HERO_GRADIENT_LIGHTEST_STOP)).toBeGreaterThanOrEqual(4.5);
  });

  it('light mode clears AA against the page canvas', () => {
    renderIn('light');
    const ink = rgbToHex(getComputedStyle(screen.getByText('app.landing.hero.subhead')).color);
    expect(contrastRatio(ink, tokens('light').surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('HeroSection — "have one already" outline CTA ink', () => {
  it('light mode clears AA against the page canvas', () => {
    renderIn('light');
    const button = screen.getByRole('button', { name: 'app.landing.hero.ctaHaveOne' });
    const ink = rgbToHex(getComputedStyle(button).color);
    expect(contrastRatio(ink, tokens('light').surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('HeroSection — trust row card', () => {
  it('light mode: card text clears AA against the card’s own (opaque) background', () => {
    renderIn('light');
    const card = screen.getByText('app.landing.hero.trust.decentralchain');
    const ink = rgbToHex(getComputedStyle(card).color);
    const bg = rgbToHex(getComputedStyle(card.parentElement as HTMLElement).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('HeroSection — decorative dark-only layers', () => {
  it('does not render AuroraField/BandTexture contour art in light mode', () => {
    const { container } = renderIn('light');
    // BandTexture's contours and AuroraField's blobs are inline <svg>/plain
    // decorative Boxes; the one unambiguous fingerprint of either is
    // BandTexture's own <title>.
    expect(container.querySelector('title')).toBeNull();
  });

  it('renders the decorative contour art in dark mode', () => {
    const { container } = renderIn('dark');
    expect(container.querySelector('title')).not.toBeNull();
  });
});
