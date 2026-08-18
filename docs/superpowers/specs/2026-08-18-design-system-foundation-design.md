# Design System Foundation — Design

**Date:** 2026-08-18
**App:** `apps/exchange`
**Status:** Approved, ready for implementation planning

This is spec 1 of 2. The Dashboard rebuild is spec 2 and depends on this one landing
first — building it against a theme still in motion would mean building it twice.

## Problem

The app has no single source of truth for its visual language, so nothing forces its
screens to agree and they have drifted apart.

Three systems each claim to define the look:

| File | Lines | Role |
|---|---:|---|
| `theme/mui-theme.ts` | 206 | `createAppTheme(mode)` — the global MUI theme, light and dark |
| `theme/landingTheme.ts` | 403 | a second MUI theme, `mode: 'light'` only |
| `styles/themes/index.ts` + `styles/tokens.ts` | 153 + 265 | the styled-components theme |

On top of that, **twelve pages override the global theme locally** with
`<ThemeProvider theme={landingTheme}>`:

```
LandingPage  SignIn  SignUp  Dashboard  Wallet  Dex  Swap
Bridge  CreateToken  ImportPage  ImportLedger  ImportAccountPage
```

Two consequences, one of them user-facing:

- **The dark/light toggle is broken.** `ThemeContext` exposes `toggleTheme`, it is wired
  into `ThemeSettings.tsx`, and it persists to `localStorage` — but `landingTheme` is
  hardcoded `mode: 'light'`, so on all twelve of those pages the control does nothing.
  The app ships a settings switch that silently fails.
- **Consistency cannot be enforced.** Every page declares its own theme, so a change to
  the "app theme" reaches almost nothing.

Separately, 85 files use styled-components and 102 use MUI. That split is real but is
**not** in scope here — see Deferred.

## Decisions

Settled during brainstorming:

| Decision | Choice |
|---|---|
| Modes | One theme, **both light and dark genuinely working**, every page honouring the toggle |
| Reference design | Copy its **visual language**; populate with real DecentralChain data |
| Marketing + auth | **Follow the toggle too** — no permanently-dark surfaces |
| Scope | Foundation + shell now; Dashboard next; CSS-in-JS consolidation deferred |

The third decision is the expensive one and is taken deliberately — see Cost below.

## Token architecture

Every colour becomes a **semantic token**, never a literal. One name, two value sets.

```
surface.base      the page ground
surface.raised    cards sitting on it
surface.sunken    wells, inset panels
surface.overlay   modals, sheets, the auth card

border.subtle     hairlines between rows
border.strong     focus rings, active edges

text.primary      body and headings
text.secondary    supporting copy
text.tertiary     metadata, timestamps

accent.primary    the brand indigo
accent.muted      its low-emphasis form

intent.success / .danger / .warning / .info
```

This is the change that makes dark mode a configuration rather than a rewrite. The
current code cannot do it because `palette.indigoHover` and `brandInk.night` are
literals with no counterpart in the other mode.

**A token-lint rule is part of this spec, not a nice-to-have.** A raw hex or `rgba()` in
a component file fails the build, with an allowlist for the token definitions themselves.
Without it this drifts again within a month — which is precisely how the current state
arose.

## `surface.overlay` is two treatments, not two colours

`GlassCard` does not invert. Dark translucent glass over the aurora field reads as
premium; the same treatment with light values is a grey box, and light "glass" rarely
looks good.

So `surface.overlay` resolves to **different physics per mode**:

- **dark** — translucent fill, `backdrop-filter` blur, lit top rim, deep shadow (what
  ships today)
- **light** — solid white card, soft diffuse shadow, hairline border, no blur

Same semantic slot, same call site, different construction. Components ask for
`surface.overlay` and do not know which they got.

## The aurora is dark-mode only

`AuroraField` and `BandTexture` were art-directed for a dark field. There is no honest
light counterpart — attempting one is where this design would go wrong.

In light mode the marketing and auth surfaces get a **quieter treatment**: a soft
vertical gradient between two near-white brand-tinted stops, no aurora, no band texture,
no glass — the auth card becomes the solid `surface.overlay` light treatment described
above, floating on that wash. The dark mode keeps today's art direction unchanged.

The exact stops are chosen during implementation and recorded in the token file; the
constraint is that the wash must never reduce body-text contrast below WCAG AA, which
the current dark canvas satisfies by a wide margin and a light wash will not
automatically.

This is the one place where the two modes are deliberately not equivalent.

## Layout shell

`layouts/PageFrame.tsx` already exists and already solves this — its own docstring names
the problem as "four title sizes across four heading tags, nine different gaps between
rows". **It is used by only 5 files.**

The work is adoption, not invention:

- Every authenticated route renders through `PageFrame`.
- One page title (`h1`, one size, once per screen), one gutter aligned to the top bar,
  one vertical rhythm (`pageRhythm`).
- Card anatomy standardised to a single set of values, derived by measuring the
  reference design and fixed in the token file: one radius, one border colour, one
  elevation, one internal padding scale. "Standardised" means every card in the app
  resolves to the same tokens — not that each screen picks its own consistent-looking
  values.

The reference design's premium feel is mostly **spacing discipline** — a consistent 8px
scale and uniform card anatomy — more than it is colour.

## Removing the per-page overrides

The twelve `<ThemeProvider theme={landingTheme}>` wrappers are deleted, and
`landingTheme.ts` is merged into the single theme. Pages inherit.

Each page must be checked after its override is removed: some will be relying on
`landingTheme` values that differ from the global theme, and those differences will
surface as visual changes. That inspection is the work, not a formality.

## Cost, stated plainly

Choosing "everything follows the toggle" means reworking components shipped days ago:

- `GlassCard` needs its light treatment (per `surface.overlay` above)
- `StepRail`, the create-wallet wizard, `SignIn`, `ImportAccount` and `SeedBackup` need
  light-mode values and QA in both modes
- the landing page needs its light art direction

Nothing is discarded — the structure holds and the tokens slot in — but this is real
rework, and it exists because the earlier work was correctly scoped to a dark-only
surface that is no longer the whole story.

## Verification

- Every screen inspected in **both** modes. A screen that was never opened in dark mode
  has not been verified.
- The existing **496 tests stay green**.
- Token-lint passes: no raw colour literals outside the token definitions.
- `tsc -b --noEmit`, `vitest run`, `biome check .`, `vite build` all clean on Node
  24.18.0.
- The dark/light toggle in `ThemeSettings` demonstrably changes every page, including
  the twelve that currently ignore it. That is the acceptance test for this spec.

## Out of scope

- **The Dashboard rebuild.** Spec 2.
- **CSS-in-JS consolidation.** 85 styled-components files against 102 MUI files. Weeks of
  mechanical migration that changes nothing visually. Worth doing eventually; not part of
  making the app consistent.
- **`SurfaceContext.chromeless`**, which is dead — `MobileAuthScreen` renders
  `<SurfaceProvider chromeless>` but `Card` never consumes it and nothing reads it. It is
  a prerequisite for any nested-surface work and should be resolved during this spec's
  card-anatomy pass, but it is called out here so it is not rediscovered as a surprise.
