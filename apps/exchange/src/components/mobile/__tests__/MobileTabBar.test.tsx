import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function renderBarAt(pathname: string, ammSupported: boolean) {
  vi.resetModules();
  vi.doMock('@/components/mobile/MobileMenuDrawer', () => ({ MobileMenuDrawer: () => null }));
  vi.doMock('@/config/amm', () => ({ AMM_SUPPORTED: ammSupported }));
  const { MobileTabBar } = await import('@/components/mobile/MobileTabBar');
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <MobileTabBar />
    </MemoryRouter>,
  );
  return within(screen.getByRole('navigation', { name: 'Primary' }));
}

afterEach(() => {
  vi.doUnmock('@/config/amm');
  vi.doUnmock('@/components/mobile/MobileMenuDrawer');
  vi.resetModules();
});

describe('MobileTabBar bridge route', () => {
  it('lights no tab for the bridge when the AMM (and so the Swap tab) is off', async () => {
    const bar = await renderBarAt('/desktop/bridge', false);
    expect(bar.queryByRole('link', { name: 'Swap' })).toBeNull();
    for (const link of bar.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('keeps the bridge under Swap when the AMM is on', async () => {
    const bar = await renderBarAt('/desktop/bridge', true);
    expect(bar.getByRole('link', { name: 'Swap' })).toHaveAttribute('aria-current', 'page');
  });
});
