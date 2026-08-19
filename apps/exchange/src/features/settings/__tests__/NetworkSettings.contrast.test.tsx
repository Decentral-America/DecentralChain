/**
 * NetworkSettings — Input/Button ink regression
 *
 * Fix round 1, Critical 1: `Input`'s ink went mode-aware (`#212121` →
 * `theme.colors.text`) when the settings feature was tokenized, but its
 * `background: white` stayed a raw literal — the extended raw-colour lint
 * (Fix round 1's root cause) now catches named CSS colours like `white`,
 * where the original rule only caught hex/`rgb()`. In dark mode that paired
 * a near-white, mode-aware ink with a fixed white background: 16.10:1 →
 * 1.09:1. The RPC-endpoint field — reachable via `SettingsPage.tsx` — went
 * effectively invisible. `Button` (the "Reset to Default Settings" control)
 * had the same defect.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { contrastRatio } from '@/theme/tokens/semantic';
import { NetworkSettings } from '../NetworkSettings';

vi.mock('data-service', () => ({ config: { setConfig: vi.fn() } }));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn() }),
}));
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    commonSettings: {
      dontShowSpam: false,
      network: {
        api: 'https://api.example',
        matcher: 'https://matcher.example',
        server: 'https://node.example',
      },
    },
    setCommonSetting: vi.fn(),
  }),
}));

describe.each([
  ['light', lightTheme] as const,
  ['dark', darkTheme] as const,
])('NetworkSettings ink — %s mode', (_mode, theme) => {
  const renderIt = () =>
    render(
      <ThemeProvider theme={theme}>
        <NetworkSettings />
      </ThemeProvider>,
    );

  it('the node-address input ink clears AA against its own background', () => {
    renderIt();
    const input = screen.getByDisplayValue('https://node.example');
    const style = getComputedStyle(input);
    const ink = rgbToHex(style.color);
    const bg = rgbToHex(style.backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the reset button ink clears AA against its own background', () => {
    renderIt();
    const button = screen.getByRole('button', { name: /reset to default settings/i });
    const style = getComputedStyle(button);
    const ink = rgbToHex(style.color);
    const bg = rgbToHex(style.backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
