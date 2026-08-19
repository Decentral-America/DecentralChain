/**
 * SecurityStatement — ink contrast across app themes (task 11)
 *
 * The whole section paints directly on the page canvas — no card of its own
 * ("It stays on the canvas rather than a raised panel" per the file's own
 * docstring) — so every ink here maps straight to `tokens(mode)`.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import SecurityStatement from '../SecurityStatement';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <SecurityStatement />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('SecurityStatement — headline ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const heading = screen.getByText('app.landing.securityStatement.headingLine1');
    const ink = rgbToHex(getComputedStyle(heading).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each([
  'light',
  'dark',
] as const)('SecurityStatement — point body ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const body = screen.getByText('app.landing.securityStatement.points.01.body');
    const ink = rgbToHex(getComputedStyle(body).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});
