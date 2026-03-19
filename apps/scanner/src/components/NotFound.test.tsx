/**
 * Tests for NotFound component.
 *
 * Covers: default render, custom title/description props, navigation buttons.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to }, children),
  useNavigate: () => mockNavigate,
}));

import NotFound from './NotFound';

describe('NotFound', () => {
  it('renders the default 404 heading and message', () => {
    render(createElement(NotFound));
    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByText('Not Found')).toBeDefined();
  });

  it('renders custom title and description', () => {
    render(
      createElement(NotFound, {
        description: 'That block does not exist.',
        title: 'Block Missing',
      }),
    );
    expect(screen.getByText('Block Missing')).toBeDefined();
    expect(screen.getByText('That block does not exist.')).toBeDefined();
  });

  it('renders the Go Back button', () => {
    render(createElement(NotFound));
    expect(screen.getByRole('button', { name: /go back/i })).toBeDefined();
  });

  it('renders the Dashboard (home) link', () => {
    render(createElement(NotFound));
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeDefined();
  });

  it('calls navigate(-1) when Go Back is clicked', async () => {
    const user = userEvent.setup();
    render(createElement(NotFound));
    await user.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
