/**
 * SignUp — canvas-ink contrast
 *
 * `AuthScene` renders a light-mode gradient wash between `surface.base` and
 * `surface.sunken` (see AuthScene.test.tsx). SignUp used to paint its own
 * text with `onCanvas.*` — ink hardcoded for the dark night canvas that used
 * to be the only option. Fix round 1 (task-4-report.md) found that ink still
 * live once the wash replaced the night canvas: white-on-near-white,
 * effectively invisible on this page.
 *
 * These tests pin real computed colour against both wash stops so a future
 * hardcoded `onCanvas`/`common.white` reintroduction fails loudly instead of
 * shipping invisible text. Note SignUp currently always renders through
 * `landingTheme` (hardcoded `mode: 'light'`), so this exercises exactly the
 * path that broke in production.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import { SignUp } from '../SignUp';

const { seedCreate } = vi.hoisted(() => ({ seedCreate: vi.fn() }));

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create: vi.fn().mockResolvedValue(undefined),
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    user: null,
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('data-service/classes/Seed', () => ({ Seed: { create: seedCreate } }));

const WASH_BASE = tokens('light').surface.base;
const WASH_SUNKEN = tokens('light').surface.sunken;

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

const expectClearsAA = (element: HTMLElement) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, WASH_BASE)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(hex, WASH_SUNKEN)).toBeGreaterThanOrEqual(4.5);
};

describe('SignUp — text painted directly on the AuthScene canvas', () => {
  it('subtitle clears AA against both wash stops', () => {
    render(<SignUp />);
    expectClearsAA(screen.getByText(/Create your wallet and get instant access/i));
  });

  it('feature title clears AA against both wash stops', () => {
    render(<SignUp />);
    expectClearsAA(screen.getByText('Non-custodial security'));
  });

  it('feature description clears AA against both wash stops', () => {
    render(<SignUp />);
    expectClearsAA(screen.getByText(/You control your private keys/i));
  });

  it('the logo wordmark accent clears AA against both wash stops', () => {
    render(<SignUp />);
    expectClearsAA(screen.getByText('.Exchange'));
  });

  it('"Already have an account? Sign in" clears AA against both wash stops', () => {
    render(<SignUp />);
    expectClearsAA(screen.getByRole('button', { name: /already have an account\? sign in/i }));
  });
});
