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
| Manifest | `…/<logos>@latest/manifest.json` | `public, max-age=604800, s-maxage=43200` |
| Tail logo | `…/<logos>@<sha>/assets/<assetId>/128.webp` | commit-pinned, immutable |

### How long a merged logo actually takes to appear

An earlier draft of this spec, and the comment in `load.ts`, both claimed
`max-age=300, stale-while-revalidate=86400` and "a merged logo appears within
about five minutes". **That was wrong.** Measured against `cdn.jsdelivr.net` on
2026-08-31 (`curl -D -` on a `@latest` path), the real response is:

```
cache-control: public, max-age=604800, s-maxage=43200
```

Two orders of magnitude longer, and no `stale-while-revalidate` at all. So:

| Who | Waits for | Up to |
|---|---|---|
| A first-time visitor | the jsDelivr edge entry (`s-maxage`) | **12 hours** |
| A returning visitor | their own browser cache (`max-age`) | **7 days** |
| Anyone doing a hard reload | nothing | immediate |

We do not set those headers and cannot change them. The delay is **accepted,
not solved**: an asset without a resolved logo shows its monogram, which is a
stable legible mark, so a logo arriving late upgrades a row rather than filling
a hole. That is the same property that makes the whole layer safe to fail.

If the latency ever has to shrink, the lever is an explicit short-lived ref or a
different CDN — not a cache-busting query parameter, which would trade a real
request on every session's first paint against a purely additive feature.

One consequence for the failure table below: because there is no
`stale-while-revalidate`, a jsDelivr outage does **not** serve a stale manifest.
It drops every hot logo to a monogram for the duration. That is still an
acceptable outcome, but it is a weaker guarantee than the earlier draft claimed.

### `@latest` requires the logo repository to stay tagless

`@latest` does not mean "the newest commit". For a GitHub repository jsDelivr
resolves it to **the newest version tag**, and only falls back to default-branch
HEAD when the repository has no tags at all. Both halves verified on 2026-08-31:

- `data.jsdelivr.com/v1/packages/gh/jquery/jquery/resolved?specifier=latest`
  returns `"version": "4.0.0"` — a tag, not a branch.
- `github/gitignore` has no tags. The same endpoint returns `"version": null`,
  yet `cdn.jsdelivr.net/gh/github/gitignore@latest/Go.gitignore` still serves
  `200` with content identical to `@main`. So the HEAD fallback is real, and
  it works despite the resolver reporting no version.

**Therefore: the logo repository must never carry a git tag or a GitHub
release.** The day anyone cuts `v1.0.0`, `@latest` silently pins to it and every
subsequently merged logo stops appearing — with no error anywhere, because the
manifest still fetches, parses and resolves perfectly. It is simply frozen.

This is a genuine trap: tagging a repository is a normal, well-intentioned act,
and nothing about the failure points back at it. The logo repository's README
must say so, and `publish.yml` should assert that `git tag --list` is empty and
fail loudly if it is not.

If tagging is ever wanted, the alternative is to abandon `@latest` and pin the
manifest URL to an explicit branch — `…/<logos>@main/manifest.json` — which
resolves to that branch's HEAD regardless of tags. That is a one-line change to
`manifestUrl` in `src/lib/tokenLogos/url.ts`.

### The `sha` chicken-and-egg

Tail URLs are pinned to `manifest.sha`, and the manifest lives inside the
repository whose sha it names. A workflow that commits the derived assets and
the regenerated manifest **together, in one commit**, can only write the sha it
knew before that commit existed — the parent. Every newly merged tail logo would
then 404, because it is being requested at a commit predating its own addition.

The publish workflow must therefore use **two commits**:

1. **Commit A — assets.** Derive `64.webp` and `128.webp` for the newly merged
   asset(s) and commit them. Do not touch `manifest.json`. Record the resulting
   sha.
2. **Commit B — manifest.** Regenerate `manifest.json` with `sha` set to
   **commit A's sha**, and commit it.

`@latest` then serves commit B's manifest, whose `sha` points at commit A, where
every derived asset already exists. The hot-set data URIs are inline so they are
unaffected either way; this ordering exists solely for the tail.

Note the reverse order does not work either. Committing the manifest first would
name a sha at which the assets do not yet exist, which is the same 404 by a
different route. Assets first, manifest second, manifest naming the assets'
commit.

A one-commit alternative would be to have the manifest name a *branch* rather
than a sha, but that gives up immutable caching on the tail — the property that
lets a tail logo be cached forever instead of revalidated on every render.

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

### The two variants, and which goes where

This is a **requirement on the logo repository's `publish.yml`**, not a
preference. The exchange cannot enforce it and does not try to:
`parseManifest` accepts any string beginning `data:image/`, so a manifest built
with the wrong variant would load, parse and render without complaint — just
three times heavier than it needs to be, on every page load, for detail nobody
can see at 20 px.

| Variant | Where it goes | How it is delivered |
|---|---|---|
| `64.webp` | the **hot set**, inside `manifest.json` | inline `data:image/webp;base64,…` |
| `128.webp` | the **tail** | its own commit-pinned URL |

The manifest inlines the **64 px** variant, never the 128. At roughly 1–2 KB
each that keeps a thirty-asset hot set near 45 KB; inlining 128 would roughly
triple it for detail no icon at 20–48 px can show. Since the manifest is
fetched on first paint of every session, its size is the one number in this
design that everyone pays for whether or not they ever see a logo.

The tail takes the **128 px** variant because a tail logo is fetched only by the
one row that needs it, so the size trade runs the other way — and because a
commit-pinned URL is cached immutably, it is paid at most once per asset.

Concretely, `publish.yml` must:

- inline `64.webp` — and only `64.webp` — for every asset whose `info.json`
  carries `"hot": true`;
- write `128.webp` — and only `128.webp` — to `assets/<assetId>/128.webp` for
  **every** asset, hot ones included. A hot asset must still have its tail file:
  hot-set membership is a reviewer's flag that can be revoked, and an asset
  dropped from the hot set must degrade to its tail URL rather than to a
  monogram;
- use `image/webp` as the data URI's media type, matching the file it inlines.

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
- **The CSP** — `connect-src` must name the CDN in every shipped policy.
  Deployment config is read by no other part of the gate, so without this the
  whole feature can be dead in a browser while everything else is green.
- **A shipped call site actually resolving a logo.** Testing `TokenIcon` with an
  `assetId` the test itself supplies proves the component works, not that
  anything passes one. All eight call sites shipped without it once already.

The suite stood at **1178 tests across 102 files** before this round's fixes and
**1195 across 104** after (measured on `dev`). The `1048` figure in an earlier
draft was a stale measurement taken while `@dcc-amm/sdk` was unbuilt, which made
three test files fail to import and contribute zero tests — see the ledger entry
for Task 1. Verification runs on Node 24.18.0: `tsc -b --noEmit`, `vitest run`,
`biome check .`, and `vite build`.

`vite build` requires `VITE_SOLANA_RPC_URL` to be set. That guard is unrelated
to this work — it arrives from the Solana bridge (`3197dbca9`) — but a bare
`vite build` fails without it and the failure looks like this change's fault.

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
