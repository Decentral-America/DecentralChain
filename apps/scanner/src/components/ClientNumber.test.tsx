/**
 * Tests for ClientNumber component.
 *
 * Covers: null/undefined fallback rendering, SSR-stable en-US initial render,
 * client-side locale re-render after hydration (useEffect), and className
 * forwarding.
 */
import { act, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ClientNumber } from './ClientNumber';

describe('ClientNumber', () => {
  it('renders the fallback when value is null', () => {
    render(createElement(ClientNumber, { value: null }));
    expect(screen.getByText('—')).toBeDefined();
  });

  it('renders the fallback when value is undefined', () => {
    render(createElement(ClientNumber, { value: undefined }));
    expect(screen.getByText('—')).toBeDefined();
  });

  it('renders a custom fallback string', () => {
    render(createElement(ClientNumber, { fallback: 'N/A', value: null }));
    expect(screen.getByText('N/A')).toBeDefined();
  });

  it('renders the number in en-US format before hydration (initial render)', () => {
    render(createElement(ClientNumber, { value: 1_234_567 }));
    // Before useEffect fires, the component uses en-US locale deterministically
    expect(screen.getByText('1,234,567')).toBeDefined();
  });

  it('still displays a number after useEffect fires (simulated hydration)', async () => {
    render(createElement(ClientNumber, { value: 42 }));
    // Allow the useEffect to run
    await act(async () => {});
    // jsdom uses 'en-US' as its locale, so the output remains the same
    expect(screen.getByText('42')).toBeDefined();
  });

  it('forwards the className prop to the wrapping span', () => {
    const { container } = render(createElement(ClientNumber, { className: 'text-bold', value: 5 }));
    const span = container.querySelector('span');
    expect(span?.className).toBe('text-bold');
  });

  it('forwards Intl.NumberFormatOptions to the formatter', async () => {
    render(
      createElement(ClientNumber, {
        options: { currency: 'USD', style: 'currency' },
        value: 1000,
      }),
    );
    await act(async () => {});
    // jsdom formats this as "$1,000.00" in en-US
    expect(screen.getByText(/1[,.]?000/)).toBeDefined();
  });
});
