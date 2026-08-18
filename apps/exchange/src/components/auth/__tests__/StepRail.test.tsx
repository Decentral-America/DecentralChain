/**
 * StepRail — unit tests
 *
 * The rail is how a user knows where they are in a four-step flow they cannot
 * safely abandon halfway, so its labelling is asserted rather than eyeballed.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepRail } from '../StepRail';

const STEPS = ['Method', 'Phrase', 'Verify', 'Secure'];

describe('StepRail', () => {
  it('renders every step label', () => {
    render(<StepRail steps={STEPS} current={0} />);
    for (const label of STEPS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('exposes progress to assistive technology', () => {
    render(<StepRail steps={STEPS} current={2} />);
    const rail = screen.getByRole('progressbar');
    expect(rail).toHaveAttribute('aria-valuenow', '3');
    expect(rail).toHaveAttribute('aria-valuemin', '1');
    expect(rail).toHaveAttribute('aria-valuemax', '4');
  });

  it('marks the current step', () => {
    render(<StepRail steps={STEPS} current={1} />);
    expect(screen.getByText('Phrase')).toHaveAttribute('data-state', 'current');
  });

  it('marks earlier steps complete and later steps upcoming', () => {
    render(<StepRail steps={STEPS} current={1} />);
    expect(screen.getByText('Method')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByText('Verify')).toHaveAttribute('data-state', 'upcoming');
  });

  it('handles the final step without overflowing the range', () => {
    render(<StepRail steps={STEPS} current={3} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  });
});
