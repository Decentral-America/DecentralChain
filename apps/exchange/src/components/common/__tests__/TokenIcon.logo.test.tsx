import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetManifestCache } from '@/lib/tokenLogos/load';
import { createAppTheme } from '@/theme/mui-theme';
import { TokenIcon } from '../TokenIcon';

const HOT = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
const MANIFEST = { hot: { [HOT]: 'data:image/webp;base64,AAAA' }, sha: 'a1b2c3d' };

const mount = (name: string, assetId?: string) =>
  render(
    <ThemeProvider theme={createAppTheme('dark')}>
      <TokenIcon name={name} {...(assetId !== undefined ? { assetId } : {})} />
    </ThemeProvider>,
  );

/**
 * `getByRole('img', ...)` cannot find this element: the icon's `alt=""` (by
 * design, for a decorative mark hidden from assistive tech) computes to ARIA
 * role `presentation`, never `img`, regardless of the `hidden` query option.
 * Querying by tag is the reliable way to reach it in tests.
 */
const getImg = (): HTMLImageElement | null => document.body.querySelector('img');

beforeEach(() => {
  resetManifestCache();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ json: () => Promise.resolve(MANIFEST), ok: true }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TokenIcon logo resolution', () => {
  it('renders the monogram immediately, before any logo resolves', () => {
    mount('Wizard Coin', HOT);
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('upgrades to the hot-set logo once the manifest lands', async () => {
    mount('Wizard Coin', HOT);
    await waitFor(() => expect(getImg()).toHaveAttribute('src', 'data:image/webp;base64,AAAA'));
  });

  it('keeps the bundled icon for a bridge asset even when an asset id is present', async () => {
    mount('Bitcoin', HOT);
    await waitFor(() => {
      const src = getImg()?.getAttribute('src');
      expect(src).not.toBe('data:image/webp;base64,AAAA');
    });
  });

  it('falls back to the monogram when the logo url fails to load', async () => {
    mount('Wizard Coin', HOT);
    const img = await waitFor(() => {
      const el = getImg();
      expect(el).not.toBeNull();
      return el as HTMLImageElement;
    });
    img.dispatchEvent(new Event('error'));
    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());
  });

  it('shows the monogram when the manifest fails entirely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    mount('Wizard Coin', HOT);
    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());
  });
});
