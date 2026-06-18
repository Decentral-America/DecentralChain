/**
 * Tests for ClientNumber component.
 *
 * Covers: null/undefined fallback rendering, SSR-stable en-US initial render,
 * client-side locale re-render after hydration (useEffect), className
 * forwarding, and Intl.NumberFormatOptions passthrough.
 */
import { act, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ClientNumber } from './ClientNumber';

describe('ClientNumber', () => {
  it('renders the default fallback "—" when value is null', () => {
    render(createElement(ClientNumber, { value: null }));
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders the default fallback "—" when value is undefined', () => {
    render(createElement(ClientNumber, { value: undefined }));
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders a custom fallback string', () => {
    render(createElement(ClientNumber, { fallback: 'N/A', value: null }));
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('renders the number in en-US format on the initial (SSR-safe) render', () => {
    render(createElement(ClientNumber, { value: 1_234_567 }));
    // Before useEffect fires, the component uses 'en-US' locale so SSR HTML
    // is deterministic and matches the first client render (avoids hydration #418).
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('continues to display the number after useEffect fires (simulated hydration)', async () => {
    render(createElement(ClientNumber, { value: 42 }));
    await act(async () => {});
    // jsdom resolves the system locale as 'en-US', so the formatted output is identical
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('forwards the className prop to the wrapping span', () => {
    const { container } = render(createElement(ClientNumber, { className: 'text-bold', value: 5 }));
    expect(container.querySelector('span')).toHaveClass('text-bold');
  });

  it('forwards Intl.NumberFormatOptions to the formatter', async () => {
    render(
      createElement(ClientNumber, {
        options: { currency: 'USD', style: 'currency' },
        value: 1000,
      }),
    );
    await act(async () => {});
    // Node/jsdom en-US currency format for 1000 USD is "$1,000.00"
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });
});
