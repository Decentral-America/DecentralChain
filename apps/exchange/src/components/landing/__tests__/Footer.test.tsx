/**
 * Footer — Ledger visibility
 *
 * The wallet-links column includes a direct link into the Ledger flow. It
 * should drop out of the list while the feature flag is off rather than
 * pointing visitors at an unfinished integration.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Footer from '../Footer';

const ledgerFlag = vi.hoisted(() => ({ enabled: false }));

vi.mock('@/config', () => ({
  config: {
    get ledgerEnabled() {
      return ledgerFlag.enabled;
    },
  },
}));

const linkHrefs = () => screen.getAllByRole('link').map((link) => link.getAttribute('href'));

describe('Footer — Ledger link', () => {
  it('drops the /import/ledger link while the feature flag is off', () => {
    ledgerFlag.enabled = false;
    render(<Footer />);
    expect(linkHrefs()).not.toContain('/import/ledger');
    // Unrelated wallet links are untouched.
    expect(linkHrefs()).toContain('/create-account');
    expect(linkHrefs()).toContain('/import');
  });

  it('includes the /import/ledger link once the feature flag is on', () => {
    ledgerFlag.enabled = true;
    render(<Footer />);
    expect(linkHrefs()).toContain('/import/ledger');
  });
});
