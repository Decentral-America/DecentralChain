/**
 * GeneralSettings — the second theme control regression
 *
 * Fix round 1 (Task 9 review): `GeneralSettings.tsx` carried its own
 * "Theme" `<Select>` bound to `commonSettings.theme` ('default' | 'black'),
 * entirely disconnected from the real `ThemeContext` that `ThemeSettings`
 * (Settings → Theme tab) drives. Toggling the real theme left this second
 * control frozen on "● Light" — the exact "settings switch that silently
 * fails" defect the whole design-system plan exists to remove, reintroduced
 * in a new spot inside the same Settings area.
 *
 * Fix: the dead control is deleted from `GeneralSettings.tsx` (and the
 * now-unused `commonSettings.theme` field is deleted from `SettingsContext`,
 * since nothing else reads it — confirmed in the fix-round report).
 * `ThemeSettings` remains the one real theme control.
 *
 * This file proves two things, using the real components `SettingsPage.tsx`
 * renders on its "General" and "Theme" tabs:
 *   1. General no longer renders a Light/Dark selector at all — nothing
 *      left that can disagree with the real toggle.
 *   2. The one real control (`ThemeSettings`) still reflects and changes
 *      the live theme from `@/contexts/ThemeContext` end to end.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { GeneralSettings } from '../GeneralSettings';
import { ThemeSettings } from '../ThemeSettings';

vi.mock('data-service', () => ({
  api: { node: { height: vi.fn().mockResolvedValue(0) } },
}));

// Mirrors NetworkSettings.contrast.test.tsx / SecuritySettings.contrast.test.tsx's
// existing pattern of mocking the whole SettingsContext module rather than
// standing up the real AuthProvider/SettingsProvider tree.
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    commonSettings: {
      advancedMode: false,
      lng: 'en',
      logoutAfterMin: 5,
    },
    setCommonSetting: vi.fn(),
  }),
}));

/** Reads the live theme so tests can assert the real control actually drives it. */
function ModeProbe() {
  const { theme } = useTheme();
  return <div data-testid="real-theme">{theme}</div>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('Settings — General must not carry a second theme control', () => {
  it('renders no Light/Dark selector in General', () => {
    const { container } = render(
      <AppThemeProvider>
        <GeneralSettings />
      </AppThemeProvider>,
    );

    // The dead control was a `<select>` whose two `<option>`s read exactly
    // "● Light" / "● Dark", under a "Theme" row label — none of that should
    // exist once it's removed.
    expect(screen.queryByText('● Light')).not.toBeInTheDocument();
    expect(screen.queryByText('● Dark')).not.toBeInTheDocument();
    expect(screen.queryByText('Theme', { exact: true })).not.toBeInTheDocument();

    // General still has its other two selects (Language, Session Timeout) —
    // this isn't a case of the whole component failing to render.
    expect(container.querySelectorAll('select')).toHaveLength(2);
  });

  it('the real control (ThemeSettings) still reflects and changes the live theme', async () => {
    const user = userEvent.setup();
    render(
      <AppThemeProvider>
        <ModeProbe />
        <GeneralSettings />
        <ThemeSettings />
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('real-theme')).toHaveTextContent('light');

    await user.click(screen.getByRole('button', { name: /dark theme/i }));

    expect(screen.getByTestId('real-theme')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: /light theme/i }));

    expect(screen.getByTestId('real-theme')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
