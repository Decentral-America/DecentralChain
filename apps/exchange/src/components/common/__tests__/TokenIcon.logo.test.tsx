import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen, waitFor } from '@testing-library/react';
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import { type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '@/config';
import { loadManifest, resetManifestCache } from '@/lib/tokenLogos/load';
import { createAppTheme } from '@/theme/mui-theme';
import { TokenIcon } from '../TokenIcon';

const HOT = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
const HOT2 = 'h82pJGF9p7kpzb6eU326EFZf2cDnimbTFVeJtx1qtBmU';
const HOT_LOGO = 'data:image/webp;base64,AAAA';
const HOT2_LOGO = 'data:image/webp;base64,BBBB';
const MANIFEST = { hot: { [HOT]: HOT_LOGO, [HOT2]: HOT2_LOGO }, sha: 'a1b2c3d' };

const icon = (name: string, assetId?: string): ReactElement => (
  <ThemeProvider theme={createAppTheme('dark')}>
    <TokenIcon name={name} {...(assetId !== undefined ? { assetId } : {})} />
  </ThemeProvider>
);

const mount = (name: string, assetId?: string) => render(icon(name, assetId));

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
    await waitFor(() => expect(getImg()).toHaveAttribute('src', HOT_LOGO));
  });

  it('keeps the bundled icon for a bridge asset even when an asset id is present', async () => {
    mount('Bitcoin', HOT);

    // The naive assertion — a bare `waitFor(() => expect(src).not.toBe(HOT_LOGO))`
    // — is already true at the very first synchronous render, before the
    // manifest promise ever settles, so `waitFor` returns without ever
    // observing the post-resolution state. Waiting on the same cached
    // `loadManifest` promise the hook awaits, wrapped in `act`, forces every
    // pending effect (including the hook's `setSrc`) to flush before the
    // assertion runs, so this genuinely observes the resolved state.
    await act(async () => {
      await loadManifest(config.logoRepo);
    });

    expect(getImg()).toHaveAttribute('src', btcIcon);
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

  /**
   * The eight call sites spent the asset id on `seed` alone. Wiring `assetId`
   * through means dropping `seed` rather than passing the same string twice, so
   * the monogram hue now falls back `seed ?? assetId ?? name`. If it fell back
   * to `name` instead, every wired row would silently recolour — a visual
   * regression nothing else in the suite would catch.
   */
  it('hashes the monogram hue from the asset id, exactly as it did from the seed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const bgOf = async (props: { assetId?: string; seed?: string }) => {
      const view = render(
        <ThemeProvider theme={createAppTheme('dark')}>
          <TokenIcon name="Wizard Coin" {...props} />
        </ThemeProvider>,
      );
      const mark = await waitFor(() => screen.getByText('W'));
      const { backgroundColor } = getComputedStyle(mark);
      view.unmount();
      return backgroundColor;
    };

    const viaSeed = await bgOf({ seed: HOT });
    const viaAssetId = await bgOf({ assetId: HOT });
    const viaName = await bgOf({});

    expect(viaAssetId).toBe(viaSeed);
    // Guards the guard: if every hue were identical the assertion above would
    // hold no matter which value seeded the hash.
    expect(viaAssetId).not.toBe(viaName);
  });

  it('recovers from a prior failure when the asset id changes', async () => {
    const view = mount('Wizard Coin', HOT);
    await waitFor(() => expect(getImg()).toHaveAttribute('src', HOT_LOGO));

    const failed = getImg() as HTMLImageElement;
    act(() => {
      failed.dispatchEvent(new Event('error'));
    });
    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());

    view.rerender(icon('Wizard Coin', HOT2));
    await waitFor(() => expect(getImg()).toHaveAttribute('src', HOT2_LOGO));
  });
});
