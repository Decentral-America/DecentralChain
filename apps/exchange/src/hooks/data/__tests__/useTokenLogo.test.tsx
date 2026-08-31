import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetManifestCache } from '@/lib/tokenLogos/load';
import { useTokenLogo } from '../useTokenLogo';

const HOT = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
const TAIL = '5rPvQ8tX2mNbVcZjKfHgWqLpYdRsTuEyAiooPLMnBvCx';
const MANIFEST = { hot: { [HOT]: 'data:image/webp;base64,AAAA' }, sha: 'a1b2c3d' };

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

describe('useTokenLogo', () => {
  it('returns the inline data uri for a hot-set asset', async () => {
    const { result } = renderHook(() => useTokenLogo(HOT));
    await waitFor(() => expect(result.current).toBe('data:image/webp;base64,AAAA'));
  });

  it('derives a commit-pinned url for an asset outside the hot set', async () => {
    const { result } = renderHook(() => useTokenLogo(TAIL));
    await waitFor(() =>
      expect(result.current).toBe(
        `https://cdn.jsdelivr.net/gh/Decentral-America/token-logos@a1b2c3d/assets/${TAIL}/128.webp`,
      ),
    );
  });

  it('returns null before the manifest resolves, so the monogram paints first', () => {
    const { result } = renderHook(() => useTokenLogo(HOT));
    expect(result.current).toBeNull();
  });

  it('returns null when no asset id is given, as for a bridge asset', async () => {
    const { result } = renderHook(() => useTokenLogo(undefined));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('returns null for an invalid asset id rather than building a traversal url', async () => {
    const { result } = renderHook(() => useTokenLogo('../../evil'));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('returns null when the manifest fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { result } = renderHook(() => useTokenLogo(HOT));
    await waitFor(() => expect(result.current).toBeNull());
  });
});
