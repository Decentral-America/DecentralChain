/**
 * StepRail — unit tests
 *
 * The rail is how a user knows where they are in a flow they cannot safely
 * abandon halfway, so its labelling is asserted rather than eyeballed. The
 * component takes any number of steps; the fixture mirrors the create-wallet
 * wizard's three so a reader is not sent looking for a step that no longer
 * exists.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { StepRail } from '../StepRail';

const STEPS = ['Start', 'Phrase', 'Secure'];

describe('StepRail', () => {
  it('renders every step label', () => {
    render(<StepRail steps={STEPS} current={0} />);
    for (const label of STEPS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('exposes progress to assistive technology', () => {
    render(<StepRail steps={STEPS} current={1} />);
    const rail = screen.getByRole('progressbar');
    expect(rail).toHaveAttribute('aria-valuenow', '2');
    expect(rail).toHaveAttribute('aria-valuemin', '1');
    expect(rail).toHaveAttribute('aria-valuemax', '3');
  });

  it('marks the current step', () => {
    render(<StepRail steps={STEPS} current={1} />);
    expect(screen.getByText('Phrase')).toHaveAttribute('data-state', 'current');
  });

  it('marks earlier steps complete and later steps upcoming', () => {
    render(<StepRail steps={STEPS} current={1} />);
    expect(screen.getByText('Start')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByText('Secure')).toHaveAttribute('data-state', 'upcoming');
  });

  it('handles the final step without overflowing the range', () => {
    render(<StepRail steps={STEPS} current={2} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  });

  it('single step does not divide by zero', () => {
    render(<StepRail steps={['Only']} current={0} />);
    expect(screen.getByText('Only')).toBeInTheDocument();
    const rail = screen.getByRole('progressbar');
    expect(rail).toHaveAttribute('aria-valuemin', '1');
    expect(rail).toHaveAttribute('aria-valuemax', '1');
    expect(rail).toHaveAttribute('aria-valuenow', '1');
    const fill = screen.getByTestId('step-rail-fill');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('fill width tracks progress', () => {
    const { rerender } = render(<StepRail steps={STEPS} current={0} />);
    let fill = screen.getByTestId('step-rail-fill');
    expect(fill).toHaveStyle({ width: '0%' });

    rerender(<StepRail steps={STEPS} current={1} />);
    fill = screen.getByTestId('step-rail-fill');
    expect(fill).toHaveStyle({ width: '50%' });

    rerender(<StepRail steps={STEPS} current={2} />);
    fill = screen.getByTestId('step-rail-fill');
    expect(fill).toHaveStyle({ width: '100%' });

    // Step counts that do not divide evenly still produce an exact width, not a
    // rounded one — the rail is generic, not pinned to the wizard's three.
    rerender(<StepRail steps={['A', 'B', 'C', 'D']} current={2} />);
    fill = screen.getByTestId('step-rail-fill');
    expect(fill).toHaveStyle({ width: '66.66666666666666%' });
  });
});

describe('StepRail in both modes', () => {
  const STEPS = ['Intro', 'Phrase', 'Secure'];

  it('renders its labels in light mode', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <StepRail steps={STEPS} current={1} />
      </ThemeProvider>,
    );
    for (const label of STEPS) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText('Phrase')).toHaveAttribute('data-state', 'current');
  });

  it('renders its labels in dark mode', () => {
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <StepRail steps={STEPS} current={1} />
      </ThemeProvider>,
    );
    for (const label of STEPS) expect(screen.getByText(label)).toBeInTheDocument();
  });
});
