# Token Logo System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any DecentralChain-issued token carry a reviewed logo, fetched from a separate PR-curated repository, with the existing monogram as the fallback on every failure path.

**Architecture:** A runtime manifest carries a small curated hot set as inline data URIs; every other logo's URL is *derived* from its asset ID, so the manifest never grows with the registry. `TokenIcon` becomes the single component that renders any asset mark. `CreateToken`'s success state gains a submission step that normalises the image client-side and opens a prefilled GitHub issue.

**Tech Stack:** React 19, TypeScript, MUI 9, Vitest, Biome, Vite 8 (Rolldown), pnpm, Node 24.18.0

**Spec:** `docs/superpowers/specs/2026-08-19-token-logo-system-design.md`

## Global Constraints

- Node **24.18.0** (`.node-version`). The pre-commit hook runs `pnpm`, and the repo requires `^22.13.0 || ^24.3.0 || >= 26.0.0`; on system Node 25 the hook **fails silently** — the commit aborts, the file stays staged, `HEAD` does not move. Always `nvm use 24.18.0` in the same shell as `git commit`.
- Verification: `./node_modules/.bin/tsc -b --noEmit`, `./node_modules/.bin/vitest run`, `pnpm exec biome check .`, `rm -rf dist && ./node_modules/.bin/vite build`.
- **1048 tests currently pass. That number must not go down.**
- Biome: 14 pre-existing warnings are expected; **0 errors** required.
- The token lint (`src/theme/__tests__/noRawColours.test.ts`) fails the build on raw hex, `rgba()`, `hsl()` and **named CSS colours** outside a 7-entry allowlist. Every colour must come from a token. **Do not add allowlist entries.**
- `contrastRatio(fg, bg)` in `src/theme/tokens/semantic.ts` is **hex-only** and **throws** on non-hex input.
- Shared test helper `src/test-utils/rgbToHex.ts` — one definition, 34 importers. Use it; do not write a local copy. It drops the alpha channel by design.
- A logo renders **only after its PR is merged**. Nothing uploaded may appear in any trading surface.
- Every failure degrades to the monogram. No error is surfaced to the user.
- **jsdom has no canvas.** `node_modules` contains no `canvas` package, so `getContext('2d')` is unavailable in tests. Pure logic must be split out from any canvas call.
- Asset IDs are interpolated into a URL path. They **must** be validated as base58 (`/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`) before use, or an ID like `../../evil` escapes the CDN path.

---

### Task 1: Remove the dead AssetLogo

`components/ui/AssetLogo.tsx` builds `https://assets-cdn.trustwallet.com/blockchains/dcc/assets/${assetId}.png`. Trust Wallet rejects brand-new tokens, so that endpoint 404s for every asset it was written for. The component has **zero consumers**.

This task has no failing test to write first: deleting unreachable code is verified by the suite continuing to pass and by `tsc` proving nothing imported it. That is stated plainly rather than inventing a test that asserts a file is absent.

**Files:**
- Delete: `src/components/ui/AssetLogo.tsx`
- Modify: `src/components/ui/index.ts` — remove lines 4-11

**Interfaces:**
- Consumes: nothing
- Produces: nothing. Frees the name `AssetLogo` for good.

- [ ] **Step 1: Confirm it is genuinely unreferenced**

```bash
cd apps/exchange
grep -rn "AssetLogo" src --include="*.tsx" --include="*.ts" | grep -v "components/ui/AssetLogo.tsx" | grep -v "components/ui/index.ts"
```

Expected: no output. If anything prints, stop and report — the premise is wrong.

- [ ] **Step 2: Delete the component**

```bash
rm src/components/ui/AssetLogo.tsx
```

- [ ] **Step 3: Remove its six exports**

In `src/components/ui/index.ts`, delete these two statements entirely:

```ts
export type { AssetLogoProps } from './AssetLogo';
export {
  AssetLogo,
  AssetLogoLarge,
  AssetLogoMedium,
  AssetLogoSmall,
  AssetLogoXLarge,
} from './AssetLogo';
```

- [ ] **Step 4: Verify nothing broke**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
```

Expected: `tsc` exit 0, **1048 passed**. A `tsc` error naming `AssetLogo` means Step 1 missed a consumer.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui
git commit -m "refactor(exchange): delete the unreachable AssetLogo

It fetched from Trust Wallet's CDN, which rejects brand-new tokens, so the
URL 404s for every asset it was written for. Zero consumers."
```

---

### Task 2: Config and URL derivation

The exchange knows exactly two URL shapes. Both are derived here, and the asset ID is validated before it ever reaches a path segment.

**Files:**
- Create: `src/lib/tokenLogos/url.ts`
- Create: `src/lib/tokenLogos/__tests__/url.test.ts`
- Modify: `src/config/index.ts` — add `logoRepo` beside the existing `import.meta.env` reads

**Interfaces:**
- Consumes: nothing
- Produces:
  - `isValidAssetId(id: string): boolean`
  - `manifestUrl(repo: string): string`
  - `logoUrlFor(repo: string, sha: string, assetId: string): string | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/tokenLogos/__tests__/url.test.ts`:

```ts
/**
 * Asset IDs are interpolated into a CDN path. An unvalidated ID escapes it —
 * `../../` walks out of the repo — so validation here is a security boundary,
 * not a formatting nicety.
 */
import { describe, expect, it } from 'vitest';
import { isValidAssetId, logoUrlFor, manifestUrl } from '../url';

const REPO = 'Decentral-America/token-logos';
const SHA = 'a1b2c3d';
const ID = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';

describe('isValidAssetId', () => {
  it('accepts a real base58 asset id', () => {
    expect(isValidAssetId(ID)).toBe(true);
  });

  it.each([
    ['path traversal', '../../etc/passwd'],
    ['a slash', 'abc/def'],
    ['empty', ''],
    ['too short', 'abc'],
    ['base58-excluded characters', '0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl'],
    ['a query string', `${ID}?x=1`],
  ])('rejects %s', (_label, bad) => {
    expect(isValidAssetId(bad)).toBe(false);
  });
});

describe('manifestUrl', () => {
  it('pins the manifest to @latest so merges go live without a redeploy', () => {
    expect(manifestUrl(REPO)).toBe(
      'https://cdn.jsdelivr.net/gh/Decentral-America/token-logos@latest/manifest.json',
    );
  });
});

describe('logoUrlFor', () => {
  it('pins a tail logo to the commit sha so it caches immutably', () => {
    expect(logoUrlFor(REPO, SHA, ID)).toBe(
      `https://cdn.jsdelivr.net/gh/Decentral-America/token-logos@${SHA}/assets/${ID}/128.webp`,
    );
  });

  it('returns null for an invalid asset id rather than building a traversal url', () => {
    expect(logoUrlFor(REPO, SHA, '../../evil')).toBeNull();
  });

  it('returns null when the sha is missing, since an unpinned url is not cacheable', () => {
    expect(logoUrlFor(REPO, '', ID)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/url.test.ts
```

Expected: FAIL — `Failed to resolve import "../url"`.

- [ ] **Step 3: Implement**

Create `src/lib/tokenLogos/url.ts`:

```ts
/**
 * The two URL shapes the exchange knows about.
 *
 * The manifest is `@latest` so a merged logo appears without redeploying the
 * exchange. Tail logos are pinned to a commit sha so they can be cached
 * immutably — an unpinned tail URL would have to be revalidated forever.
 */
const CDN = 'https://cdn.jsdelivr.net/gh';

/**
 * Base58: no `0`, `O`, `I` or `l`. DecentralChain asset ids are 32-44 chars.
 *
 * This is a security boundary, not formatting. The id becomes a path segment,
 * so `../../` would walk out of the repository root.
 */
const ASSET_ID = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidAssetId(id: string): boolean {
  return ASSET_ID.test(id);
}

export function manifestUrl(repo: string): string {
  return `${CDN}/${repo}@latest/manifest.json`;
}

/**
 * `null` means "do not attempt a fetch" — the caller falls back to the
 * monogram, which is the correct outcome for both a malformed id and a
 * manifest that arrived without a sha.
 */
export function logoUrlFor(repo: string, sha: string, assetId: string): string | null {
  if (!sha || !isValidAssetId(assetId)) return null;
  return `${CDN}/${repo}@${sha}/assets/${assetId}/128.webp`;
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/url.test.ts
```

Expected: PASS, 10 tests.

- [ ] **Step 5: Add the repo to config**

In `src/config/index.ts`, inside the object returned by `getConfig()`, add — keeping the file's existing alphabetical ordering:

```ts
    logoRepo: import.meta.env.VITE_LOGO_REPO || 'Decentral-America/token-logos',
```

Add the matching field to the `Config` interface in the same file:

```ts
  /** `owner/name` of the PR-curated logo repository. */
  logoRepo: string;
```

- [ ] **Step 6: Run the full gate and commit**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
git add src/lib/tokenLogos src/config/index.ts
git commit -m "feat(exchange): derive the token-logo cdn urls, validating asset ids"
```

---

### Task 3: Manifest parsing

Parsing is separated from fetching so the tolerant-to-garbage behaviour can be tested without a network. A malformed manifest must degrade to empty, never throw — a logo layer cannot be allowed to break a trading surface.

**Files:**
- Create: `src/lib/tokenLogos/manifest.ts`
- Create: `src/lib/tokenLogos/__tests__/manifest.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface LogoManifest { hot: Record<string, string>; sha: string }`
  - `const EMPTY_MANIFEST: LogoManifest`
  - `parseManifest(raw: unknown): LogoManifest`

- [ ] **Step 1: Write the failing test**

Create `src/lib/tokenLogos/__tests__/manifest.test.ts`:

```ts
/**
 * Every malformed shape must degrade to empty rather than throw. This layer is
 * purely additive: if it fails, every asset shows its monogram and the app is
 * still fully usable.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_MANIFEST, parseManifest } from '../manifest';

const ID = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';

describe('parseManifest', () => {
  it('reads a well-formed manifest', () => {
    const parsed = parseManifest({
      hot: { [ID]: 'data:image/webp;base64,AAAA' },
      sha: 'a1b2c3d',
    });
    expect(parsed.sha).toBe('a1b2c3d');
    expect(parsed.hot[ID]).toBe('data:image/webp;base64,AAAA');
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an array', []],
    ['a missing sha', { hot: {} }],
    ['a non-object hot', { hot: 'nope', sha: 'a1b2c3d' }],
    ['a numeric sha', { hot: {}, sha: 7 }],
  ])('degrades %s to the empty manifest', (_label, raw) => {
    expect(parseManifest(raw)).toEqual(EMPTY_MANIFEST);
  });

  it('drops hot entries whose asset id is invalid', () => {
    const parsed = parseManifest({
      hot: { '../../evil': 'data:image/webp;base64,AAAA', [ID]: 'data:image/webp;base64,BBBB' },
      sha: 'a1b2c3d',
    });
    expect(Object.keys(parsed.hot)).toEqual([ID]);
  });

  it('drops hot entries that are not data uris, so a url cannot be smuggled in', () => {
    const parsed = parseManifest({
      hot: { [ID]: 'https://evil.example/track.gif' },
      sha: 'a1b2c3d',
    });
    expect(parsed.hot).toEqual({});
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/manifest.test.ts
```

Expected: FAIL — `Failed to resolve import "../manifest"`.

- [ ] **Step 3: Implement**

Create `src/lib/tokenLogos/manifest.ts`:

```ts
import { isValidAssetId } from './url';

export interface LogoManifest {
  /** assetId -> inline data URI, for the curated hot set only. */
  hot: Record<string, string>;
  /** Commit sha that tail URLs are pinned to. Empty means "no tail fetches". */
  sha: string;
}

export const EMPTY_MANIFEST: LogoManifest = { hot: {}, sha: '' };

/**
 * Tolerant by design. A malformed manifest yields the empty one, which shows
 * every asset its monogram — the same outcome as a network failure, and a
 * perfectly usable app.
 *
 * Hot entries are required to be `data:` URIs. Accepting an arbitrary URL here
 * would let whoever controls the manifest point an `<img>` at a third-party
 * host on every page load.
 */
export function parseManifest(raw: unknown): LogoManifest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return EMPTY_MANIFEST;

  const { hot, sha } = raw as { hot?: unknown; sha?: unknown };
  if (typeof sha !== 'string' || !sha) return EMPTY_MANIFEST;
  if (typeof hot !== 'object' || hot === null || Array.isArray(hot)) return EMPTY_MANIFEST;

  const clean: Record<string, string> = {};
  for (const [assetId, value] of Object.entries(hot as Record<string, unknown>)) {
    if (!isValidAssetId(assetId)) continue;
    if (typeof value !== 'string' || !value.startsWith('data:image/')) continue;
    clean[assetId] = value;
  }

  return { hot: clean, sha };
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/manifest.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokenLogos
git commit -m "feat(exchange): parse the logo manifest, degrading to empty on any malformed shape"
```

---

### Task 4: Manifest loading with a session cache

**Files:**
- Create: `src/lib/tokenLogos/load.ts`
- Create: `src/lib/tokenLogos/__tests__/load.test.ts`

**Interfaces:**
- Consumes: `manifestUrl`, `parseManifest`, `EMPTY_MANIFEST`, `LogoManifest`
- Produces:
  - `loadManifest(repo: string): Promise<LogoManifest>`
  - `resetManifestCache(): void` — test seam only

- [ ] **Step 1: Write the failing test**

Create `src/lib/tokenLogos/__tests__/load.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_MANIFEST } from '../manifest';
import { loadManifest, resetManifestCache } from '../load';

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
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/load.test.ts
```

Expected: FAIL — `Failed to resolve import "../load"`.

- [ ] **Step 3: Implement**

Create `src/lib/tokenLogos/load.ts`:

```ts
import { EMPTY_MANIFEST, type LogoManifest, parseManifest } from './manifest';
import { manifestUrl } from './url';

/**
 * One fetch per session. The promise itself is cached, not just its result, so
 * a page mounting twenty `TokenIcon`s at once issues one request rather than
 * twenty — every icon awaits the same in-flight promise.
 *
 * Freshness is the CDN's job: the manifest is served
 * `max-age=300, stale-while-revalidate=86400`, so a merged logo appears within
 * about five minutes and an outage keeps serving the last good copy.
 */
let inFlight: Promise<LogoManifest> | null = null;

export function resetManifestCache(): void {
  inFlight = null;
}

export function loadManifest(repo: string): Promise<LogoManifest> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch(manifestUrl(repo));
      if (!response.ok) return EMPTY_MANIFEST;
      return parseManifest(await response.json());
    } catch {
      // Offline, blocked, CORS, malformed body — all the same outcome: every
      // asset shows its monogram, which is a perfectly usable app.
      return EMPTY_MANIFEST;
    }
  })();

  return inFlight;
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/load.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokenLogos
git commit -m "feat(exchange): load the logo manifest once per session, never throwing"
```

---

### Task 5: The `useTokenLogo` hook

**Files:**
- Create: `src/hooks/data/useTokenLogo.ts`
- Create: `src/hooks/data/__tests__/useTokenLogo.test.tsx`

**Interfaces:**
- Consumes: `loadManifest`, `logoUrlFor`, `getConfig().logoRepo`
- Produces: `useTokenLogo(assetId?: string): string | null` — a data URI, a CDN URL, or `null` meaning "render the monogram"

- [ ] **Step 1: Write the failing test**

Create `src/hooks/data/__tests__/useTokenLogo.test.tsx`:

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetManifestCache } from '@/lib/tokenLogos/load';
import { useTokenLogo } from '../useTokenLogo';

const HOT = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
const TAIL = '5rPvQ8tX2mNbVcZjKfHgWqLpYdRsTuEyAiOoPlMnBvCx';
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
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/hooks/data/__tests__/useTokenLogo.test.tsx
```

Expected: FAIL — `Failed to resolve import "../useTokenLogo"`.

- [ ] **Step 3: Implement**

Create `src/hooks/data/useTokenLogo.ts`:

```ts
import { useEffect, useState } from 'react';
import { getConfig } from '@/config';
import { loadManifest } from '@/lib/tokenLogos/load';
import { logoUrlFor } from '@/lib/tokenLogos/url';

/**
 * Resolves an asset id to a logo source, or `null` for "render the monogram".
 *
 * `null` is the value before the manifest resolves, which is deliberate: the
 * monogram paints immediately and a logo upgrades it when it arrives. Nothing
 * ever renders blank or spins.
 */
export function useTokenLogo(assetId?: string): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    const { logoRepo } = getConfig();

    void loadManifest(logoRepo).then((manifest) => {
      if (cancelled) return;
      setSrc(manifest.hot[assetId] ?? logoUrlFor(logoRepo, manifest.sha, assetId));
    });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return src;
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/hooks/data/__tests__/useTokenLogo.test.tsx
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/data
git commit -m "feat(exchange): resolve an asset id to a logo, monogram until it lands"
```

---

### Task 6: Wire the logo into `TokenIcon`

`TokenIcon` keys bridge assets on `name` (`"Bitcoin"`, `"Ether"` — what the API actually returns). Issued tokens key on `assetId`. These are **different namespaces**: the six bundled icons are not DCC assets and will never have an asset ID, so this is one component with two lookups, not one lookup.

The docstring's claim that a CDN "would have to widen `img-src`" is false — the CSP is already `img-src 'self' data: https:`. Correct it while the file is open.

**Files:**
- Modify: `src/components/common/TokenIcon.tsx`
- Create: `src/components/common/__tests__/TokenIcon.logo.test.tsx`

**Interfaces:**
- Consumes: `useTokenLogo(assetId?: string): string | null`
- Produces: `TokenIcon` gains an optional `assetId?: string` prop. All existing call sites keep working untouched.

- [ ] **Step 1: Write the failing test**

Create `src/components/common/__tests__/TokenIcon.logo.test.tsx`:

```ts
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
      <TokenIcon name={name} assetId={assetId} />
    </ThemeProvider>,
  );

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
    await waitFor(() =>
      expect(screen.getByRole('img', { hidden: true })).toHaveAttribute(
        'src',
        'data:image/webp;base64,AAAA',
      ),
    );
  });

  it('keeps the bundled icon for a bridge asset even when an asset id is present', async () => {
    mount('Bitcoin', HOT);
    await waitFor(() => {
      const src = screen.getByRole('img', { hidden: true }).getAttribute('src');
      expect(src).not.toBe('data:image/webp;base64,AAAA');
    });
  });

  it('falls back to the monogram when the logo url fails to load', async () => {
    mount('Wizard Coin', HOT);
    const img = await screen.findByRole('img', { hidden: true });
    img.dispatchEvent(new Event('error'));
    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());
  });

  it('shows the monogram when the manifest fails entirely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    mount('Wizard Coin', HOT);
    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/components/common/__tests__/TokenIcon.logo.test.tsx
```

Expected: FAIL — the hot-set assertion times out, because `TokenIcon` ignores `assetId` today.

- [ ] **Step 3: Implement**

In `src/components/common/TokenIcon.tsx`:

Replace the third paragraph of the file docstring — the one claiming `img-src` would have to widen — with:

```
 * Bundled icons cover the bridge assets, which are keyed by the name the API
 * returns and have no DecentralChain asset id. Issued tokens are keyed by
 * asset id and resolve through the logo manifest. Two lookups, one component.
 *
 * The monogram paints first in every case, so a logo arriving late upgrades a
 * row rather than filling a hole. That is what makes lazily fetching the tail
 * acceptable here. (`img-src` already allows both the CDN and data URIs:
 * `'self' data: https:`.)
```

Add the import and extend the props:

```ts
import { useState } from 'react';
import { useTokenLogo } from '@/hooks/data/useTokenLogo';

interface TokenIconProps {
  name: string;
  /** DecentralChain asset id. Absent for bridge assets, which key on `name`. */
  assetId?: string;
  /** Hashed for the fallback colour — the mint, so it is stable per asset. */
  seed?: string;
  size?: number;
}
```

Replace the component body's icon resolution:

```ts
export const TokenIcon: React.FC<TokenIconProps> = ({ name, assetId, seed, size = 20 }) => {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const [remoteFailed, setRemoteFailed] = useState(false);
  const remote = useTokenLogo(assetId);

  const bundled = name === 'DCC' ? DCC_MARK[mode] : ICON_BY_NAME[name];
  const icon = bundled ?? (remoteFailed ? undefined : (remote ?? undefined));

  if (icon) {
    return (
      <Box
        component="img"
        src={icon}
        alt=""
        aria-hidden
        onError={() => setRemoteFailed(true)}
        sx={{ borderRadius: '50%', display: 'block', height: size, width: size }}
      />
    );
  }
  // ...monogram below is unchanged
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/components/common/__tests__/TokenIcon.logo.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Confirm the eight existing consumers still pass**

```bash
./node_modules/.bin/vitest run
```

Expected: **1048 + the new tests**, none failing. `assetId` is optional, so every existing call site is untouched.

- [ ] **Step 6: Commit**

```bash
git add src/components/common
git commit -m "feat(exchange): TokenIcon resolves issued-token logos, monogram first"
```

---

### Task 7: Crop geometry

**jsdom has no canvas**, so the resize cannot be unit-tested end to end. The geometry is therefore extracted as a pure function and tested exhaustively; Task 8's canvas call is a thin shell over it. This is a deliberate split, not an oversight — see Task 8's note on what is left uncovered.

**Files:**
- Create: `src/lib/tokenLogos/geometry.ts`
- Create: `src/lib/tokenLogos/__tests__/geometry.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface CropRect { sx: number; sy: number; size: number }`
  - `const LOGO_SIZE = 256`
  - `squareCrop(width: number, height: number): CropRect`

- [ ] **Step 1: Write the failing test**

Create `src/lib/tokenLogos/__tests__/geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LOGO_SIZE, squareCrop } from '../geometry';

describe('squareCrop', () => {
  it('takes the full frame when the image is already square', () => {
    expect(squareCrop(64, 64)).toEqual({ size: 64, sx: 0, sy: 0 });
  });

  it('centres horizontally on a landscape image', () => {
    expect(squareCrop(100, 50)).toEqual({ size: 50, sx: 25, sy: 0 });
  });

  it('centres vertically on a portrait image', () => {
    expect(squareCrop(50, 100)).toEqual({ size: 50, sx: 0, sy: 25 });
  });

  it('rounds rather than leaving a fractional offset', () => {
    expect(squareCrop(101, 50)).toEqual({ size: 50, sx: 26, sy: 0 });
  });

  it('handles an image smaller than the target without upscaling the crop box', () => {
    expect(squareCrop(32, 16)).toEqual({ size: 16, sx: 8, sy: 0 });
  });

  it('exports the submitted size the spec requires', () => {
    expect(LOGO_SIZE).toBe(256);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/geometry.test.ts
```

Expected: FAIL — `Failed to resolve import "../geometry"`.

- [ ] **Step 3: Implement**

Create `src/lib/tokenLogos/geometry.ts`:

```ts
/**
 * The submitted format, matching the convention contributors already know from
 * Trust Wallet: 256x256 PNG. The small variants the app actually renders are
 * derived in the logo repository, not here.
 */
export const LOGO_SIZE = 256;

export interface CropRect {
  sx: number;
  sy: number;
  size: number;
}

/**
 * The largest centred square that fits the source.
 *
 * Pure on purpose: jsdom has no canvas, so this is the part that can be tested.
 * Cropping before scaling is what stops a wide banner being squashed into a
 * circle — the icon is round, so the corners are discarded anyway.
 */
export function squareCrop(width: number, height: number): CropRect {
  const size = Math.min(width, height);
  return {
    size,
    sx: Math.round((width - size) / 2),
    sy: Math.round((height - size) / 2),
  };
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/geometry.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokenLogos
git commit -m "feat(exchange): centre-square crop geometry for logo submission"
```

---

### Task 8: Normalise a chosen image

A thin shell over Task 7's geometry. **It has no unit test, and that is stated rather than papered over:** `getContext('2d')`, `createImageBitmap` and `toBlob` are all absent from jsdom, and `node_modules` has no `canvas` package. Adding one would pull a native toolchain into the test run to cover twenty lines of glue. The geometry it delegates to is exhaustively tested; the shell is verified by using it.

**Files:**
- Create: `src/lib/tokenLogos/normalize.ts`

**Interfaces:**
- Consumes: `LOGO_SIZE`, `squareCrop`
- Produces:
  - `const MAX_LOGO_BYTES = 100 * 1024`
  - `normalizeLogo(file: File): Promise<Blob>` — rejects with a user-facing `Error`

- [ ] **Step 1: Implement**

Create `src/lib/tokenLogos/normalize.ts`:

```ts
import { LOGO_SIZE, squareCrop } from './geometry';

/** The logo repository's ceiling, matching Trust Wallet's convention. */
export const MAX_LOGO_BYTES = 100 * 1024;

/**
 * Centre-crops to square, scales to 256x256 and re-encodes as PNG.
 *
 * Re-encoding is not only about size: decoding and redrawing strips EXIF, so a
 * photo carrying GPS coordinates does not travel to a public repository
 * attached to the submitter's wallet address.
 *
 * No unit test: jsdom implements none of `createImageBitmap`, `getContext` or
 * `toBlob`, and this repo has no `canvas` package. The geometry this delegates
 * to is tested exhaustively in `geometry.test.ts`.
 */
export async function normalizeLogo(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, size } = squareCrop(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = LOGO_SIZE;
  canvas.height = LOGO_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the image in this browser.');

  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, LOGO_SIZE, LOGO_SIZE);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) throw new Error('Could not prepare the image in this browser.');

  if (blob.size > MAX_LOGO_BYTES) {
    throw new Error('That image is too detailed to compress under 100 KB. Try a simpler mark.');
  }

  return blob;
}
```

- [ ] **Step 2: Verify it compiles and lints**

```bash
./node_modules/.bin/tsc -b --noEmit
pnpm exec biome check src/lib/tokenLogos
```

Expected: exit 0, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tokenLogos
git commit -m "feat(exchange): normalise a chosen logo to 256x256 png, stripping metadata"
```

---

### Task 9: Build the prefilled issue URL

Intake is an **issue**, not a pull request, because a PR URL cannot carry binary: `value` fills a text box and the safe URL ceiling is ~2,000 characters against a ~13,600-character base64 PNG. Issue bodies accept drag-and-drop image upload natively.

**Files:**
- Create: `src/lib/tokenLogos/submission.ts`
- Create: `src/lib/tokenLogos/__tests__/submission.test.ts`

**Interfaces:**
- Consumes: `isValidAssetId`
- Produces:
  - `interface LogoSubmission { assetId: string; name: string; symbol: string; issuer: string }`
  - `logoIssueUrl(repo: string, submission: LogoSubmission): string | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/tokenLogos/__tests__/submission.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { logoIssueUrl } from '../submission';

const REPO = 'Decentral-America/token-logos';
const SUB = {
  assetId: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  issuer: '3PQ6wCS3zAkDEJtvGntQZbjuLw24kxTqndr',
  name: 'Wizard Coin',
  symbol: 'WIZ',
};

describe('logoIssueUrl', () => {
  it('targets the logo repository issue form', () => {
    expect(logoIssueUrl(REPO, SUB)).toContain(
      'https://github.com/Decentral-America/token-logos/issues/new',
    );
  });

  it('carries every field the intake action needs to open the pull request', () => {
    const body = new URL(logoIssueUrl(REPO, SUB) as string).searchParams.get('body') ?? '';
    expect(body).toContain(SUB.assetId);
    expect(body).toContain(SUB.name);
    expect(body).toContain(SUB.symbol);
    expect(body).toContain(SUB.issuer);
  });

  it('labels the issue so the intake action can find it', () => {
    const url = new URL(logoIssueUrl(REPO, SUB) as string);
    expect(url.searchParams.get('labels')).toBe('logo-submission');
  });

  it('encodes a name containing characters that would break the query string', () => {
    const url = logoIssueUrl(REPO, { ...SUB, name: 'A&B #1 = "best"' }) as string;
    expect(() => new URL(url)).not.toThrow();
    expect(new URL(url).searchParams.get('title')).toContain('A&B #1 = "best"');
  });

  it('stays inside the practical url ceiling', () => {
    expect((logoIssueUrl(REPO, SUB) as string).length).toBeLessThan(2000);
  });

  it('returns null for an invalid asset id', () => {
    expect(logoIssueUrl(REPO, { ...SUB, assetId: '../../evil' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/submission.test.ts
```

Expected: FAIL — `Failed to resolve import "../submission"`.

- [ ] **Step 3: Implement**

Create `src/lib/tokenLogos/submission.ts`:

```ts
import { isValidAssetId } from './url';

export interface LogoSubmission {
  assetId: string;
  name: string;
  symbol: string;
  issuer: string;
}

/**
 * Opens a GitHub issue with every field the intake Action needs, pre-filled.
 *
 * An issue rather than a pull request because a PR URL cannot carry the image:
 * `value` fills a text box, the safe URL ceiling is about 2,000 characters, and
 * a 256x256 PNG is roughly 13,600 base64 characters. Issue bodies accept
 * drag-and-drop image upload natively and host the result, so the one manual
 * step is dropping in a file the browser has already downloaded.
 */
export function logoIssueUrl(repo: string, submission: LogoSubmission): string | null {
  const { assetId, name, symbol, issuer } = submission;
  if (!isValidAssetId(assetId)) return null;

  const body = [
    `**Asset ID:** \`${assetId}\``,
    `**Name:** ${name}`,
    `**Symbol:** ${symbol}`,
    `**Issuer:** \`${issuer}\``,
    '',
    '---',
    '',
    '### Attach the logo',
    '',
    'Drag the `logo.png` this page downloaded into the box below, then submit.',
    '',
    '- [ ] 256x256, square, under 100 KB',
    '- [ ] Transparent background, no text or watermark',
    '- [ ] I have the right to publish this image',
  ].join('\n');

  const params = new URLSearchParams({
    body,
    labels: 'logo-submission',
    title: `Add logo: ${name} (${symbol})`,
  });

  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/lib/tokenLogos/__tests__/submission.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokenLogos
git commit -m "feat(exchange): build the prefilled logo-submission issue url"
```

---

### Task 10: The submission step in `CreateToken`

`CreateToken`'s success state is one line today (`CreateToken.tsx:1189-1191`): an `Alert` reading `Token created! Asset ID: …`. It becomes the entry point for adding a logo.

**Files:**
- Create: `src/features/token-logos/LogoSubmissionCard.tsx`
- Create: `src/features/token-logos/__tests__/LogoSubmissionCard.test.tsx`
- Modify: `src/pages/CreateToken.tsx` — the `submitSuccess && issuedAssetId` block

**Interfaces:**
- Consumes: `normalizeLogo` (which enforces `MAX_LOGO_BYTES` itself and throws a user-facing message), `logoIssueUrl`, `getConfig().logoRepo`
- Produces: `<LogoSubmissionCard assetId name symbol issuer />`

- [ ] **Step 1: Write the failing test**

Create `src/features/token-logos/__tests__/LogoSubmissionCard.test.tsx`:

```ts
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { LogoSubmissionCard } from '../LogoSubmissionCard';

const PROPS = {
  assetId: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  issuer: '3PQ6wCS3zAkDEJtvGntQZbjuLw24kxTqndr',
  name: 'Wizard Coin',
  symbol: 'WIZ',
};

const mount = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <LogoSubmissionCard {...PROPS} />
    </ThemeProvider>,
  );

describe('LogoSubmissionCard', () => {
  it.each(['light', 'dark'] as const)('offers a file picker in %s mode', (mode) => {
    mount(mode);
    expect(screen.getByLabelText(/choose an image/i)).toBeInTheDocument();
  });

  it('tells the user the logo appears only after review', () => {
    mount('light');
    expect(screen.getByText(/after it is reviewed/i)).toBeInTheDocument();
  });

  it('does not render a submission link until an image has been prepared', () => {
    mount('light');
    expect(screen.queryByRole('link', { name: /open the submission/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/features/token-logos/__tests__/LogoSubmissionCard.test.tsx
```

Expected: FAIL — `Failed to resolve import "../LogoSubmissionCard"`.

- [ ] **Step 3: Implement the card**

Create `src/features/token-logos/LogoSubmissionCard.tsx`. Every colour must come from a token — the raw-colour lint fails the build otherwise, and it catches named colours too.

```tsx
/**
 * The hand-off from "your token exists" to "your token has a logo".
 *
 * The image never renders in a trading surface from here: it is normalised,
 * downloaded and handed to a GitHub issue. A logo only appears in the app once
 * its pull request is merged, which is what makes a logo mean "reviewed" rather
 * than "uploaded" — and is why nobody can issue a look-alike token wearing a
 * well-known mark.
 */
import { Alert, Box, Button, Link, Stack, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { getConfig } from '@/config';
import { normalizeLogo } from '@/lib/tokenLogos/normalize';
import { logoIssueUrl } from '@/lib/tokenLogos/submission';
import { tokens } from '@/theme/tokens/semantic';

interface LogoSubmissionCardProps {
  assetId: string;
  name: string;
  symbol: string;
  issuer: string;
}

export const LogoSubmissionCard: React.FC<LogoSubmissionCardProps> = ({
  assetId,
  name,
  symbol,
  issuer,
}) => {
  const t = tokens(useTheme().palette.mode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueUrl = logoIssueUrl(getConfig().logoRepo, { assetId, issuer, name, symbol });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const blob = await normalizeLogo(file);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'logo.png';
      anchor.click();
      URL.revokeObjectURL(url);
      setReady(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare that image.');
    }
  };

  return (
    <Box
      sx={{
        bgcolor: t.surface.raised,
        border: `1px solid ${t.border.subtle}`,
        borderRadius: 2,
        mt: 2,
        p: 3,
      }}
    >
      <Stack spacing={2}>
        <Typography sx={{ color: t.text.primary, fontWeight: 600 }}>Add a logo</Typography>
        <Typography variant="body2" sx={{ color: t.text.secondary }}>
          Your token shows its initials until a logo is added. Submit one and it will appear
          across the exchange after it is reviewed.
        </Typography>

        <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
          Choose an image
          <input
            hidden
            type="file"
            accept="image/*"
            aria-label="Choose an image"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {ready && issueUrl && (
          <Alert severity="success">
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>logo.png</strong> has been downloaded. Open the submission and drag it in.
            </Typography>
            <Link href={issueUrl} target="_blank" rel="noopener noreferrer">
              Open the submission on GitHub
            </Link>
          </Alert>
        )}
      </Stack>
    </Box>
  );
};
```

- [ ] **Step 4: Run it and watch it pass**

```bash
./node_modules/.bin/vitest run src/features/token-logos/__tests__/LogoSubmissionCard.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Render it from the success state**

In `src/pages/CreateToken.tsx`, replace the success block:

```tsx
{submitSuccess && issuedAssetId && (
  <Alert severity="success" sx={{ mt: 2 }}>
    Token created! Asset ID: <strong>{issuedAssetId}</strong>
  </Alert>
)}
```

with:

```tsx
{submitSuccess && issuedAssetId && (
  <>
    <Alert severity="success" sx={{ mt: 2 }}>
      Token created! Asset ID: <strong>{issuedAssetId}</strong>
    </Alert>
    <LogoSubmissionCard
      assetId={issuedAssetId}
      name={tokenName}
      symbol={tokenName.slice(0, 4).toUpperCase()}
      issuer={user?.address ?? ''}
    />
  </>
)}
```

Add the import at the top of the file:

```ts
import { LogoSubmissionCard } from '@/features/token-logos/LogoSubmissionCard';
```

**Before writing this, read the surrounding component** to confirm the exact state variable holding the token's name and the hook exposing the issuer address. The names above (`tokenName`, `user?.address`) are the expected ones; if they differ, use what the file actually has and note the difference in your report.

- [ ] **Step 6: Run the full gate**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
rm -rf dist && ./node_modules/.bin/vite build
```

Expected: `tsc` 0, all tests pass with no drop from 1048 plus the new ones, biome 0 errors, build clean.

- [ ] **Step 7: Commit**

```bash
git add src/features/token-logos src/pages/CreateToken.tsx
git commit -m "feat(exchange): offer logo submission once a token is created"
```

---

## Deferred

Not part of this plan.

- **The logo repository itself** — `intake.yml`, `validate.yml`, `publish.yml`, the validation scripts and the README defining the standard. A separate effort; this plan builds the exchange side and the two-URL contract it depends on.
- **OAuth one-click submission.** Needs a GitHub App and a backend to hold the client secret. Revisit if drop-off at the drag-and-drop step proves high.
- **Editing or replacing a logo after merge.** Same PR path; no in-app flow.
- **Multiple derived sizes.** One `128.webp` covers every current display size at 2x retina.
