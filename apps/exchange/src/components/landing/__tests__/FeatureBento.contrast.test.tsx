/**
 * FeatureBento — ink contrast across app themes (task 11)
 *
 * Unlike Hero/BigCTA, this section has never painted on a fixed gradient —
 * it sits directly on the page canvas and its cards are one step up
 * (`brandCanvas.raised` / `brandSurface`), so every ink here maps straight to
 * `tokens(mode)` per the task-11 brief's substitution table. Same idiom as
 * `SignUp.canvasContrast.test.tsx`: `getComputedStyle` → hex → `contrastRatio`.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import FeatureBento from '../FeatureBento';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <FeatureBento />
    </ThemeProvider>,
  );

describe.each([
  'light',
  'dark',
] as const)('FeatureBento — section heading ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const heading = screen.getByText('app.landing.featureBento.headingLine1');
    const ink = rgbToHex(getComputedStyle(heading).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('FeatureBento — feature card ink (%s mode)', (mode) => {
  it('title clears AA against the card’s own background', () => {
    renderIn(mode);
    const title = screen.getByText('app.landing.featureBento.features.1.0.title');
    const ink = rgbToHex(getComputedStyle(title).color);
    const card = title.parentElement as HTMLElement;
    const bg = rgbToHex(getComputedStyle(card).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('body clears AA against the card’s own background', () => {
    renderIn(mode);
    const body = screen.getByText('app.landing.featureBento.features.1.0.body');
    const ink = rgbToHex(getComputedStyle(body).color);
    const card = body.parentElement as HTMLElement;
    const bg = rgbToHex(getComputedStyle(card).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
