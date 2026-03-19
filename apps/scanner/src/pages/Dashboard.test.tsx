/**
 * DCC-111 — Dashboard page smoke tests.
 *
 * Covers: component renders without crashing, stat cards populated after
 * query settlement, auto-refresh toggle interaction.
 *
 * Strategy:
 * - Mock @/lib/api so no real network calls are made.
 * - Mock react-router to avoid needing a real router context.
 * - Use real LanguageProvider + QueryClientProvider.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../components/contexts/LanguageContext';

// ── mock react-router (hoisted before component import by Vitest) ──────────
vi.mock('react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to }, children),
  useNavigate: () => vi.fn(),
}));

// ── mock @/lib/api ─────────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
  fetchBlockAt: vi.fn().mockResolvedValue({ height: 1 }),
  fetchBlockHeadersSeq: vi.fn().mockResolvedValue([
    {
      generator: '3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy',
      height: 100,
      id: 'hdr100',
      signature: 'sig100',
      timestamp: 1_700_000_000_000,
      transactionCount: 3,
    },
    {
      generator: '3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy',
      height: 99,
      id: 'hdr99',
      signature: 'sig99',
      timestamp: 1_699_999_995_000,
      transactionCount: 1,
    },
  ]),
  fetchHeight: vi.fn().mockResolvedValue({ height: 100 }),
  fetchLastBlock: vi.fn().mockResolvedValue({
    generator: '3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy',
    height: 100,
    reward: 600_000_000,
    signature: 'abcdeabcdeabcde',
    timestamp: 1_700_000_000_000,
    transactionCount: 3,
    transactions: [],
    version: 5,
  }),
  fetchNodeStatus: vi
    .fn()
    .mockResolvedValue({ blockGeneratorStatus: 'generating', peersCount: 12 }),
  fetchNodeVersion: vi.fn().mockResolvedValue({ version: 'DCC v1.3.5' }),
}));

// Static imports — vi.mock is hoisted above all imports by Vitest transform
import Dashboard from './Dashboard';

// ── Wrapper ────────────────────────────────────────────────────────────────
function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return createElement(
    QueryClientProvider,
    { client },
    createElement(LanguageProvider, null, children),
  );
}

function renderDashboard() {
  return render(createElement(Dashboard), { wrapper: Wrapper });
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('Dashboard page', () => {
  it('renders without crashing', () => {
    renderDashboard();
    expect(document.body).toBeTruthy();
  });

  it('shows auto-refresh toggle on mount', () => {
    renderDashboard();
    expect(document.getElementById('auto-refresh')).not.toBeNull();
  });

  it('auto-refresh toggle is checked by default', () => {
    renderDashboard();
    const toggle = document.getElementById('auto-refresh');
    // Radix Switch renders aria-checked attribute
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
  });

  it('populates current height stat card after data loads', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('100')).toBeDefined();
    });
  });

  it('displays node version after data loads', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('DCC v1.3.5')).toBeDefined();
    });
  });

  it('shows recent blocks table rows after headers load', async () => {
    renderDashboard();
    await waitFor(() => {
      const text = document.body.textContent ?? '';
      expect(text).toContain('99');
    });
  });

  it('can toggle auto-refresh off', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const toggle = document.getElementById('auto-refresh');
    expect(toggle).not.toBeNull();

    if (!toggle) throw new Error('auto-refresh toggle not found');
    await user.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });
});
