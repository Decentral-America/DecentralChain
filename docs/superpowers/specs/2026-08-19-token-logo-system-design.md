# Token Logo System — Design

**Date:** 2026-08-19
**App:** `apps/exchange` (plus a new, separate logo repository)
**Status:** Approved, ready for implementation planning

## Problem

Tokens issued on DecentralChain have no way to get a logo, and the code that
was supposed to provide one does not work.

`components/ui/AssetLogo.tsx` builds its URL as:

```
https://assets-cdn.trustwallet.com/blockchains/dcc/assets/${assetId}.png
```

That is Trust Wallet's CDN. Trust Wallet's own listing rules state that **brand
new tokens are not accepted** — a token issued through this app could never be
served from there. The component also has **zero consumers**: it is exported
from `components/ui/index.ts` and rendered nowhere. It is dead code pointing at
an endpoint that would 404 for every asset it was written for.

The component that actually renders (`components/common/TokenIcon.tsx`, 8
consumers) hardcodes six bundled icons from the `cryptocurrency-icons` package
and falls back to a hashed-hue monogram. It works well, but it cannot answer the
question "what does *this* issued token look like", because nothing can.

`CreateToken` collects no image. On success it renders one line — `Token
created! Asset ID: …` — and the flow ends there.

## Decisions

Settled during brainstorming:

| Decision | Choice |
|---|---|
| Source of truth | A **separate GitHub repository**, curated by pull request |
| Trust model | A logo renders **only after its PR is merged** |
| Submission | Prefilled GitHub **issue** + Action that opens the PR |
| Scope | **Unify** on one component; delete the dead one |
| Delivery | **Runtime manifest** (hot set) + **derived URLs** (tail) |

The delivery decision replaced an earlier proposal that inlined a hot set into
the bundle at build time. That version was rejected because it coupled the
exchange's build to the logo repo: a merged logo would not appear until someone
redeployed the exchange, which defeats the point of a separate repository.

## Why an issue and not a pull request

GitHub supports prefilling a new file through query parameters — `filename` and
`value` on the new-file URL, plus `quick_pull=1`, `title` and `body` for the
pull request itself.

`value` fills a **text box**. It cannot carry binary content, and the practical
URL ceiling is roughly **2,000 characters** (server-side buffers cap around 8 KB
regardless — nginx `large_client_header_buffers`, Apache `LimitRequestLine`).

A 256×256 PNG is around 10 KB, or **~13,600 base64 characters**. A preloaded
pull request therefore cannot carry a raster logo. It can carry JSON, a small
SVG, or the PR text — nothing more.

Issue bodies, by contrast, accept drag-and-drop image upload natively and host
the result. That single asymmetry is the reason the intake path is an issue with
an Action behind it rather than a direct pull request.

## The contract between the two repositories

The logo repository owns the standard, the review, and the build. The exchange
knows two URL shapes and nothing else.

```
<logos-repo>/
  assets/<assetId>/
    logo.png            submitted; 256×256; the source of truth
    info.json           name, symbol, links, submitter address
    64.webp  128.webp   derived on merge; never hand-edited
  manifest.json         generated: hot-set data URIs + commit sha
  .github/workflows/    intake, validate, publish
```

The exchange consumes exactly two things:

| Purpose | URL | Cache |
|---|---|---|
| Manifest | `…/<logos>@latest/manifest.json` | `max-age=300, stale-while-revalidate=86400` |
| Tail logo | `…/<logos>@<sha>/assets/<assetId>/128.webp` | commit-pinned, immutable |

Five minutes keeps a merged logo appearing promptly; the day-long
`stale-while-revalidate` window means a CDN outage serves the last good manifest
rather than dropping every hot logo to a monogram.

**There is no index for the tail.** The URL is derived from the asset ID, so the
manifest carries only the hot set and stays a constant size whether the registry
holds fifty tokens or five thousand. This is the property that answers "we do
not know how many tokens there will be": the hot-set size is data in the logo
repo, not a constant in this codebase.

**Hot-set membership is a flag, not a computation.** `info.json` carries
`"hot": true`, set by a reviewer at merge time. The alternative — deriving the
set from trading volume — would need the logo repo to query chain data on a
schedule and would churn the manifest without anyone deciding to. A flag keeps
the decision human, auditable in the PR, and free of a data dependency the
repository otherwise does not have.

The manifest inlines the **64 px** variant as a data URI, not the 128. At
roughly 1–2 KB each that keeps a thirty-asset hot set near 45 KB; inlining 128
would roughly triple it for detail no icon at 20–48 px can show.

`256×256 PNG` is the submitted format because it matches the convention
submitters already know from Trust Wallet and gives reviewers enough detail to
judge. Serving it raw at a 20 px icon would be wasteful, so the Action derives
the small variants. **The source of truth and the delivery format are not the
same artifact.**

`128.webp` is the single derived size for the tail. Icons render at 20–48 px, so
128 covers every current size at 2× retina with one artifact rather than a size
matrix. A future large token-detail header is the reason to revisit that number.

## Submission flow

The `CreateToken` success state becomes the entry point.

1. The user picks an image. Client-side: centre-crop to square, resize to
   256×256, encode PNG, strip metadata, reject over 100 KB.
2. The browser downloads it, already named `logo.png`.
3. A prefilled GitHub issue opens carrying the asset ID, name, symbol, issuer
   address and a checklist.
4. The user drags the PNG into the issue body.
5. `intake.yml` parses the issue, downloads the attachment, validates it, opens
   the pull request and links back to the issue.
6. A human reviews and merges. `publish.yml` derives `64.webp` and `128.webp`
   and regenerates `manifest.json`.

Step 4 is the only manual action, and GitHub offers no way to remove it without
an OAuth app — which would require a client secret, and therefore a backend this
project does not currently run.

## Rendering

One component. Four-step resolution, with the **monogram painted first in every
case**, so no surface ever renders blank or spins:

```
bundled by name    BTC/ETH/SOL — bridge assets, no DCC asset ID
  → hot manifest by assetId    in memory, zero requests
  → derived URL by assetId     lazy, commit-pinned, immutable
  → monogram                   already on screen; simply stays
```

The bundled icons and the repository logos occupy **different namespaces**.
`TokenIcon` keys bridge assets on `name` (`"Bitcoin"`, `"Ether"` — the value the
API actually returns), while issued tokens key on `assetId`. Unification means
one component with both lookups, not one lookup: those six are not DCC assets
and will never have an asset ID.

The manifest is fetched once, cached in memory for the session, and never blocks
a render.

## Failure behaviour

Every failure degrades to the monogram, and none surfaces an error to the user:

| Failure | Result |
|---|---|
| Manifest fetch fails | All monograms; app fully functional |
| Per-asset 404 (no logo submitted) | Monogram permanently; no retry storm |
| CDN outage | Monograms everywhere |
| Malformed manifest | Treated as empty |

This is the design's central safety property: **the logo layer is purely
additive and cannot break a trading surface.** It is also why lazy-loading the
tail is acceptable here when it would not be elsewhere — the fallback is a
legible, stable, per-asset mark, so a logo arriving late upgrades the row from
*fine* to *branded* rather than filling a hole.

Two CSP directives are involved, and only one of them was already open.

`img-src 'self' data: https:` does allow both the CDN's `<img>` and inline data
URIs, so the rendering half needs no change. But the manifest arrives by
`fetch()`, and `fetch()` is governed by **`connect-src`** — which in this app is
an allowlist of named hosts, not a blanket `https:`. `https://cdn.jsdelivr.net`
therefore has to be added to `connect-src` explicitly.

It has to be added in **five** places, not one. `apps/exchange/vite.config.ts`
carries the dev-server policy; `apps/exchange/nginx.conf` and
`apps/exchange/docker/nginx/default.conf` each declare it twice — once on the
server block and once again inside the nested `location ~* \.html$` block,
because nginx's `add_header` does **not** inherit into a location that declares
any header of its own. The `.html$` copies are the ones that actually reach
`index.html`, and therefore the SPA; missing them would leave the fetch blocked
in production while the server-block policy looked correct.

A blocked manifest is not a partial failure. `loadManifest` catches the
resulting `TypeError` and yields `EMPTY_MANIFEST`, whose `sha` is `''`, and
`logoUrlFor` returns `null` for an empty sha — so one refused request takes out
the hot set *and* the tail, and every asset falls to its monogram.

`apps/exchange/src/lib/tokenLogos/__tests__/csp.test.ts` asserts the host is
present in every shipped `connect-src`; deployment config is otherwise read by
no part of the gate, so tsc, biome and vitest would all stay green while the
feature was dead in a browser.

`TokenIcon`'s original docstring claimed a CDN would require widening `img-src`.
That was wrong in both directions — `img-src` needed nothing, and the directive
that *did* need widening went unmentioned. It has been corrected.

## Validation

The Action is the only validator that counts. It enforces dimensions, file size,
transparent background, and that the asset ID exists on chain. It must also
reject a directory whose name differs from an existing one only by case: base58
asset IDs are case-sensitive, but macOS filesystems are not, so a case-variant
directory would collide on a contributor's machine.

Client-side checks in `CreateToken` are a courtesy to the submitter. Anyone can
open a pull request by hand, so nothing enforced only in the browser is a
control.

## Scope in this repository

- **Delete** `components/ui/AssetLogo.tsx` and its six exports from
  `components/ui/index.ts` — `AssetLogo`, the four size wrappers
  (`Small`/`Medium`/`Large`/`XLarge`) and the `AssetLogoProps` type. All dead;
  the endpoint they point at is unreachable.
- **Extend** `components/common/TokenIcon.tsx` with asset-ID resolution and the
  manifest hook, preserving the existing name-keyed bundled path and monogram.
- **Add** the logo step to `CreateToken`'s success state: client-side
  normalisation, download, and the prefilled issue link.
- **Widen** `connect-src` by `https://cdn.jsdelivr.net` in all five shipped
  CSPs (`vite.config.ts`, and the server + `.html$` blocks of both
  `nginx.conf` and `docker/nginx/default.conf`). Nothing else in any policy
  changes.
- **Correct** the stale `img-src` claim in `TokenIcon`'s docstring, which named
  the one directive that needed nothing and omitted the one that did.

## Testing

- Image normalisation: crop, resize, format, size rejection
- URL derivation from asset ID
- Manifest parsing, including malformed and empty input
- `TokenIcon` resolution order across all four steps
- Each failure path falling back to the monogram

The suite currently stands at **1048 tests** (verified against `dev` at
`22e513af6`). Verification runs on Node 24.18.0: `tsc -b --noEmit`,
`vitest run`, `biome check .`, and `vite build`.

The token lint (`theme/__tests__/noRawColours.test.ts`) is live and fails the
build on raw colour literals outside a seven-entry allowlist. Any colour this
work introduces must come from a token.

## Out of scope

- **The logo repository's own build-out.** Three workflows, validation scripts
  and a README defining the standard. Real work, and a separate effort — this
  spec covers the exchange side plus the contract between them.
- **OAuth one-click submission.** Requires a GitHub App and a backend to hold
  the client secret. Revisit if drop-off at the drag-and-drop step proves high.
- **Multiple derived sizes.** One `128.webp` covers every current display size
  at 2× retina.
- **Editing or replacing a logo after merge.** Follows the same PR path; no
  in-app flow.
