import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadManifest, resetManifestCache } from '../load';
import { EMPTY_MANIFEST } from '../manifest';

const REPO = 'Decentral-America/token-logos';
const ID = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
const GOOD = { hot: { [ID]: 'data:image/webp;base64,AAAA' }, sha: 'a1b2c3d' };

beforeEach(() => {
  resetManifestCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadManifest', () => {
  it('fetches and parses the manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(GOOD), ok: true }),
    );
    await expect(loadManifest(REPO)).resolves.toEqual(GOOD);
  });

  it('returns the empty manifest when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(loadManifest(REPO)).resolves.toEqual(EMPTY_MANIFEST);
  });

  it('returns the empty manifest on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadManifest(REPO)).resolves.toEqual(EMPTY_MANIFEST);
  });

  it('returns the empty manifest when the body is not json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.reject(new Error('bad')), ok: true }),
    );
    await expect(loadManifest(REPO)).resolves.toEqual(EMPTY_MANIFEST);
  });

  it('fetches once and serves the rest of the session from memory', async () => {
    const spy = vi.fn().mockResolvedValue({ json: () => Promise.resolve(GOOD), ok: true });
    vi.stubGlobal('fetch', spy);
    await loadManifest(REPO);
    await loadManifest(REPO);
    await loadManifest(REPO);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const spy = vi.fn().mockResolvedValue({ json: () => Promise.resolve(GOOD), ok: true });
    vi.stubGlobal('fetch', spy);
    await Promise.all([loadManifest(REPO), loadManifest(REPO), loadManifest(REPO)]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  /**
   * The cache is keyed by `repo`, not global. A single session realistically
   * only ever asks for one repository, but a cache that takes an argument and
   * then ignores it is a trap: the second caller silently receives the first
   * caller's manifest, and the sha it carries pins tail URLs into the *wrong*
   * repository. Keying it costs a Map.
   */
  it('caches per repository rather than globally', async () => {
    const spy = vi.fn().mockResolvedValue({ json: () => Promise.resolve(GOOD), ok: true });
    vi.stubGlobal('fetch', spy);

    await loadManifest(REPO);
    await loadManifest('Someone-Else/other-logos');

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.map((call) => call[0] as string)).toEqual([
      'https://cdn.jsdelivr.net/gh/Decentral-America/token-logos@latest/manifest.json',
      'https://cdn.jsdelivr.net/gh/Someone-Else/other-logos@latest/manifest.json',
    ]);
  });
});
