/**
 * CreateWalletWizard — contrast regression
 *
 * The Back button used to paint `onCanvas.secondary` — ink hardcoded for the
 * dark-only glass `GlassCard` used to be. `GlassCard` is a solid white card
 * in light mode (Task 3), and no prior test wrapped the wizard in a
 * `ThemeProvider`, so nothing would catch that literal being reintroduced —
 * jsdom renders any syntactically valid CSS colour without error,
 * `toBeInTheDocument` included — see task-7-report.md's Step 3 note.
 *
 * This test pins the Back button's real computed colour against the card
 * background it actually sits on, in both modes, so a future hardcoded
 * literal fails loudly instead of shipping unreadable text. Same pattern as
 * `SignUp.canvasContrast.test.tsx`: `getComputedStyle` → hex → `contrastRatio`
 * asserted directly with `toBeGreaterThanOrEqual`, never inferred through a
 * DOM-presence assertion that a bad colour would still pass.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { CreateWalletWizard } from '../CreateWalletWizard';
import { useCreateWallet } from '../useCreateWallet';

const PHRASE =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron';

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create: vi.fn(),
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
vi.mock('data-service/classes/Seed', () => ({
  Seed: { create: () => ({ phrase: PHRASE }) },
}));

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */
/**
 * Drops any alpha channel: `.slice(0, 3)` keeps r/g/b and discards a 4th
 * match, so an ink specified with alpha would be measured against its own
 * r/g/b as if fully opaque — overstating its contrast once alpha actually
 * composites onto the background. Every current call site here passes an
 * opaque colour, so this is exact today; it is a structural limitation of
 * this idiom (duplicated across 15+ contrast test files) rather than a bug
 * in any one test. See task-8-report.md, Finding 5.
 */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Asserts directly on `contrastRatio(...)`, not on a boolean wrapper —
 * `contrastRatio` returns `NaN` for an unparseable colour, and `NaN` fails
 * `toBeGreaterThanOrEqual` loudly rather than passing vacuously.
 */
const expectClearsAA = (element: HTMLElement, bg: string) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
};

function Wizard() {
  return <CreateWalletWizard wallet={useCreateWallet()} />;
}

/** Back is only rendered from the phrase step onward. */
const renderOnPhraseStep = async (mode: ThemeMode) => {
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <Wizard />
    </ThemeProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  await screen.findByRole('heading', { name: /your recovery phrase/i });
};

describe('CreateWalletWizard — Back button ink on GlassCard', () => {
  it('clears AA against the card in light mode', async () => {
    await renderOnPhraseStep('light');
    expectClearsAA(
      screen.getByRole('button', { name: /^back$/i }),
      tokens('light').surface.overlay,
    );
  });

  it('clears AA against the card in dark mode', async () => {
    await renderOnPhraseStep('dark');
    expectClearsAA(screen.getByRole('button', { name: /^back$/i }), tokens('dark').surface.overlay);
  });
});
