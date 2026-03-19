/**
 * Tests for RouteError component.
 *
 * Covers: 404 route error (renders NotFound), generic route error with
 * statusText, plain Error object, and unknown error fallback.
 */
import { render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
let mockError: unknown = new Error('Test error');

vi.mock('react-router', () => ({
  isRouteErrorResponse: (e: unknown) => {
    return e !== null && typeof e === 'object' && 'status' in (e as object);
  },
  Link: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to }, children),
  useNavigate: () => mockNavigate,
  useRouteError: () => mockError,
}));

import RouteError from './RouteError';

describe('RouteError', () => {
  it('renders NotFound when error is a 404 route response', () => {
    mockError = { status: 404, statusText: 'Not Found' };
    render(createElement(RouteError));
    expect(screen.getByText('404')).toBeDefined();
  });

  it('renders generic error UI for a route response with statusText', () => {
    mockError = { status: 500, statusText: 'Internal Server Error' };
    render(createElement(RouteError));
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Internal Server Error')).toBeDefined();
  });

  it('renders error message when error is an Error instance', () => {
    mockError = new Error('Network failure');
    render(createElement(RouteError));
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Network failure')).toBeDefined();
  });

  it('renders fallback message for unknown error type', () => {
    mockError = 'unexpected string error';
    render(createElement(RouteError));
    expect(screen.getByText('An unexpected error occurred.')).toBeDefined();
  });

  it('renders route error status code in message when statusText is absent', () => {
    mockError = { status: 503, statusText: '' };
    render(createElement(RouteError));
    expect(screen.getByText('Error 503')).toBeDefined();
  });

  it('renders Go Back and Retry buttons', () => {
    mockError = new Error('Some error');
    render(createElement(RouteError));
    expect(screen.getByRole('button', { name: /go back/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined();
  });

  it('renders NotFound with custom props when passed', () => {
    mockError = { status: 404, statusText: 'Not Found' };
    render(createElement(RouteError, { notFoundTitle: 'Block Not Found' }));
    expect(screen.getByText('Block Not Found')).toBeDefined();
  });
});
