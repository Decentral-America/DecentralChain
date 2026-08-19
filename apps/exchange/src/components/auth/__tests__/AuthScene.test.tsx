/**
 * AuthScene — unit tests
 *
 * The aurora and band texture were art-directed for a dark field and have no
 * honest light counterpart, so light mode gets a quiet gradient wash instead.
 * These tests pin that the decorative layers are genuinely absent in light mode
 * rather than merely recoloured.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { AuthScene } from '../AuthScene';

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AuthScene>
        <button type="button">Sign in</button>
      </AuthScene>
    </ThemeProvider>,
  );

describe('AuthScene', () => {
  it('renders its children in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { unmount } = renderIn(mode);
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      unmount();
    }
  });

  it('draws the aurora in dark mode', () => {
    renderIn('dark');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'aurora');
  });

  it('omits the aurora in light mode', () => {
    renderIn('light');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'wash');
  });
});
