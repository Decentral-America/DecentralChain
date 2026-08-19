/**
 * SecuritySettings — ScriptButton ink regression
 *
 * Fix round 1, Critical 2: `ScriptButton`'s fill went mode-aware
 * (`#4caf50` → `theme.colors.success`) when the settings feature was
 * tokenized, but its `color: white` stayed a raw literal — the extended
 * raw-colour lint (Fix round 1's root cause) now catches named CSS colours
 * like `white`, where the original rule only caught hex/`rgb()`. In dark
 * mode `theme.colors.success` is a light mint, not a deep green, so
 * `white` on it measures 2.78 → 1.77:1; `theme.colors.onSuccess` (the ink
 * built for exactly this fill) gives 10.32:1.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { contrastRatio } from '@/theme/tokens/semantic';
import { SecuritySettings } from '../SecuritySettings';

vi.mock('data-service', () => ({
  signature: {
    getSignatureApi: () => ({
      getEncodedSeed: async () => null,
      getPrivateKey: async () => null,
      getPublicKey: async () => null,
      getSeed: async () => null,
    }),
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn() }),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { address: '3P123', hasScript: false, publicKey: 'pub123' },
  }),
}));
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    commonSettings: { advancedMode: true },
  }),
}));
// The modals are always mounted (closed) alongside `ScriptButton` — stubbed
// out because their own provider requirements (routing, transaction
// signing, ...) are irrelevant to this test's one assertion.
vi.mock('../modals', () => ({
  ChangePasswordModal: () => null,
  DeleteAccountModal: () => null,
  ExportAccountModal: () => null,
  ScriptModal: () => null,
}));

describe.each([
  ['light', lightTheme] as const,
  ['dark', darkTheme] as const,
])('SecuritySettings ScriptButton ink — %s mode', (_mode, theme) => {
  it('clears AA against its own solid success fill', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SecuritySettings />
      </ThemeProvider>,
    );
    // `SecuritySettings` loads its secret data asynchronously on mount; wait
    // for that state update to settle before reading computed style, so the
    // assertion reflects the component's steady state, not a mid-render one.
    const button = await screen.findByRole('button', { name: /set script/i });
    const style = getComputedStyle(button);
    const ink = rgbToHex(style.color);
    const bg = rgbToHex(style.backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
