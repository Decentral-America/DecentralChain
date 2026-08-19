/**
 * PageFrame — unit tests
 *
 * One h1 per screen is the invariant; the shell exists because the app had four
 * title sizes across four heading tags.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { PageFrame } from '../PageFrame';

const renderFrame = () =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <PageFrame title="Portfolio" subtitle="Your holdings">
        <div>content</div>
      </PageFrame>
    </ThemeProvider>,
  );

describe('PageFrame', () => {
  it('renders exactly one level-1 heading', () => {
    renderFrame();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders the title, subtitle and children', () => {
    renderFrame();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Portfolio');
    expect(screen.getByText('Your holdings')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
