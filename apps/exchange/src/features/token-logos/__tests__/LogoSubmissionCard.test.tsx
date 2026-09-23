import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { LogoSubmissionCard } from '../LogoSubmissionCard';

const PROPS = {
  assetId: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  issuer: '3PQ6wCS3zAkDEJtvGntQZbjuLw24kxTqndr',
  name: 'Wizard Coin',
  symbol: 'WIZ',
};

const mount = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <LogoSubmissionCard {...PROPS} />
    </ThemeProvider>,
  );

describe('LogoSubmissionCard', () => {
  it.each(['light', 'dark'] as const)('offers a file picker in %s mode', (mode) => {
    mount(mode);
    expect(screen.getByLabelText(/choose an image/i)).toBeInTheDocument();
  });

  it('tells the user the logo appears only after review', () => {
    mount('light');
    expect(screen.getByText(/after it is reviewed/i)).toBeInTheDocument();
  });

  it('does not render a submission link until an image has been prepared', () => {
    mount('light');
    expect(screen.queryByRole('link', { name: /open the submission/i })).not.toBeInTheDocument();
  });
});
