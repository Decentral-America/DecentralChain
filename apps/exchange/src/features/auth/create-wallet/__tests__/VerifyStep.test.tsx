/**
 * VerifyStep — unit tests
 *
 * Passing every challenge is the only route to the password step, so the
 * advance conditions are asserted rather than assumed.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VerifyStep } from '../steps/VerifyStep';
import { type VerifyChallenge } from '../verification';

const CHALLENGES: VerifyChallenge[] = [
  { answer: 'melody', choices: ['melody', 'rate', 'zoo', 'kid'], position: 1 },
  { answer: 'worth', choices: ['iron', 'worth', 'cook', 'safe'], position: 7 },
];

describe('VerifyStep', () => {
  it('shows the first challenge position', () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    expect(screen.getByText(/word #1/i)).toBeInTheDocument();
  });

  it('advances to the next challenge on a correct answer', async () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    expect(await screen.findByText(/word #7/i)).toBeInTheDocument();
  });

  it('does not advance on a wrong answer', async () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'zoo' }));
    expect(screen.getByText(/word #1/i)).toBeInTheDocument();
  });

  it('marks a wrong answer without locking the user out', async () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'zoo' }));
    expect(screen.getByRole('button', { name: 'melody' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    expect(await screen.findByText(/word #7/i)).toBeInTheDocument();
  });

  it('calls onComplete only after every challenge passes', async () => {
    const onComplete = vi.fn();
    render(<VerifyStep challenges={CHALLENGES} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    expect(onComplete).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('button', { name: 'worth' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete again if the final tile is clicked again', async () => {
    const onComplete = vi.fn();
    render(<VerifyStep challenges={CHALLENGES} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    const finalTile = await screen.findByRole('button', { name: 'worth' });
    await userEvent.click(finalTile);
    await userEvent.click(finalTile);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
