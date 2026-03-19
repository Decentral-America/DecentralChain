/**
 * Tests for CopyButton component.
 *
 * Covers: default render, copy action, tooltip states, custom label.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock copyToClipboard to avoid navigator.clipboard in jsdom
vi.mock('@/components/utils/formatters', () => ({
  copyToClipboard: vi.fn(),
}));

import CopyButton from './CopyButton';

describe('CopyButton', () => {
  it('renders copy icon by default', () => {
    render(createElement(CopyButton, { text: 'hello' }));
    const btn = screen.getByRole('button');
    expect(btn).toBeDefined();
    expect(btn.getAttribute('aria-label')).toBe('Copy');
  });

  it('renders with custom label', () => {
    render(createElement(CopyButton, { label: 'Copy address', text: 'abc' }));
    const btn = screen.getByRole('button', { name: 'Copy address' });
    expect(btn).toBeDefined();
  });

  it('changes aria-label to Copied after click', () => {
    render(createElement(CopyButton, { text: 'test-value' }));
    const btn = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();
  });

  it('resets aria-label back to Copy after 2 seconds', async () => {
    vi.useFakeTimers();
    render(createElement(CopyButton, { text: 'reset-test' }));
    const btn = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();
    await act(async () => {
      vi.advanceTimersByTime(2001);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDefined();
    vi.useRealTimers();
  });
});
