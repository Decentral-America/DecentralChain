# Launcher App Grid — Design

**Date:** 2026-08-20
**App:** `apps/exchange`
**Status:** Approved, ready for implementation planning

This is sub-project 1 of an ongoing effort to raise the visual polish of the
authenticated product. It is scoped deliberately narrowly: the launcher is one
surface, it is self-contained, and the decisions it settles — how a colour that
identifies a feature enters a system that forbids raw colour, what a tile is,
how "you are here" reads once fill is spoken for — become the vocabulary the
later page work inherits. Each following group of pages gets its own spec.

## Problem

`AppLauncher` presents fifteen destinations as wide cards on three shelves. Each
card is a 40px plate holding a monochrome glyph, a label, and a sentence of
description. Every plate is the same colour: `action.selected` at rest,
`primary.main` when current.

That is a *list with icons*, not an app grid. Because the plates are uniform, the
glyph is the only thing distinguishing one destination from another, so the eye
has to read before it can choose. Fifteen near-identical rows is precisely the
density at which reading stops being fast.

The requested direction is an iOS springboard: a flat grid of coloured tiles
where colour and shape do the identifying and reading is the fallback, not the
entry point.

## Constraints this has to respect

Two properties of the codebase shape the whole design:

- **`src/theme/__tests__/noRawColours.test.ts` fails the build** on any hex,
  `rgb()`, or named colour outside the token files. Fifteen tile hues cannot be
  typed into a component. They have to enter through `semantic.ts` or they do not
  enter at all.
- **Every fill in this system ships the ink that survives on it, per mode.**
  `intent.success` has `intent.onSuccess`; `accent.primary` has
  `accent.onPrimary`. The file documents why: a fill sitting at medium luminance
  has no single ink that clears AA against both modes. A new family of fills
  inherits that obligation.

## What changes

1. A new `appTile` hue family in `semantic.ts` — eight named hues, each a fill
   and its verified ink, per mode.
2. `AppLauncher` becomes a flat grid of coloured tiles; group shelves go.
3. `navigation.tsx` gains a `hue` per destination, loses `LAUNCHER_GROUPS`, and
   sheds the positional casts `TOP_TABS` currently uses.

## The token layer

```ts
export type AppTileHue =
  | 'indigo' | 'violet' | 'blue'  | 'teal'
  | 'green'  | 'amber'  | 'rose'  | 'slate';

export interface SemanticTokens {
  // …existing roles
  appTile: Record<AppTileHue, { fill: string; on: string }>;
}
```

Light mode uses deep fills with white glyphs; dark mode inverts to light tints
with near-black (`#14122b`) glyphs — the same inversion `intent` already applies,
for the same reason.

| hue | light fill | glyph | vs base | dark fill | glyph | vs base |
|---|---|---:|---:|---|---:|---:|
| indigo | `#5b4bdb` | 6.04 | 5.66 | `#8b7dff` | 5.63 | 6.05 |
| violet | `#7c3aed` | 5.70 | 5.33 | `#c4b5fd` | 9.88 | 10.63 |
| blue | `#1d4ed8` | 6.70 | 6.27 | `#7dd3fc` | 10.94 | 11.77 |
| teal | `#0f766e` | 5.47 | 5.12 | `#5eead4` | 12.33 | 13.27 |
| green | `#15803d` | 5.02 | 4.69 | `#4ade80` | 10.47 | 11.26 |
| amber | `#b45309` | 5.02 | 4.70 | `#fcd34d` | 12.65 | 13.61 |
| rose | `#be123c` | 6.29 | 5.88 | `#fda4af` | 9.65 | 10.38 |
| slate | `#475569` | 7.58 | 7.09 | `#a8b3c4` | 8.61 | 9.26 |

"glyph" is the ink against its own fill; "vs base" is the fill against that
mode's `surface.base`. All sixteen glyph pairs clear 4.5:1 — stricter than the
3:1 WCAG 1.4.11 asks of a graphic, but consistent with the rule the rest of the
system holds. Every fill clears 4.69:1 against its ground, so a tile reads as an
object without needing a border.

`indigo` is deliberately the same value as `accent.primary`. The house colour
staying on Dashboard is what keeps the launcher looking like this product rather
than a generic springboard.

### Why eight hues and not fifteen

Fifteen hues that stay mutually distinguishable *and* clear AA in both modes do
not exist without some pairs collapsing into each other. Eight is the number that
survives both tests. It also fixes the family as a set of roles rather than a
per-feature lookup: a sixteenth destination reuses a hue instead of inventing
one, which is what stops the palette drifting the way `styles/tokens.ts`'
`palette` did.

Colour here is a mnemonic, not an encoding. Every tile also carries a distinct
glyph and a text label, so identity is never colour-alone and a colour-blind user
loses nothing functional.

## The grid

Columns are **pinned per breakpoint**, not left to `auto-fill`:

```
xs: repeat(3, 1fr)   sm: repeat(4, 1fr)   md+: repeat(7, 1fr)
```

with a 20px gap.

This is a correctness decision, not an aesthetic one. Hue repeats are placed so
no two tiles of the same hue touch — but adjacency depends on the column count,
and `auto-fill` with `minmax(96px, 1fr)` would also produce 5, 6, and 8 columns
at intermediate widths, each of which puts a repeated pair side by side. The
three pinned counts are verified clean. The dialog at `maxWidth="md"` already
lands on 7, so the common case is unchanged.

## Tile anatomy

```
┌────────┐   64px square, radii.cards (16px), appTile.<hue>.fill
│   ⇄    │   28px glyph, appTile.<hue>.on, aria-hidden
└────────┘
  Swap       label below the tile, on surface.base — not on the fill
```

The label sits on the page ground in `text.primary` at 13px, centred, wrapping
to at most two lines. Keeping it off the fill means label legibility depends on
`surface.base`, which is already verified, rather than on eight separate fills.

### "You are here" needs a new signal

Today the current destination is shown by filling its plate with `primary.main`.
Per-app colour takes that away — the fill now identifies the *feature*, so it
cannot also identify the *state*.

Current route instead gets a 2px `accent.primary` ring offset 3px from the tile,
and its label switches to `accent.primary` at weight 600. Both clear their
ground: the ring is a graphic needing 3:1 and measures 5.66:1 light / 6.05:1
dark; the label is text needing 4.5:1 and measures the same. `aria-current="page"`
is retained as the non-visual signal.

## Interaction

| state | treatment |
|---|---|
| hover | tile `scale(1.04)`, tooltip reveals the description |
| press | tile `scale(0.97)` |
| `:focus-visible` | a wider, `accent.primaryHover` ring (6px band, vs. the current-route ring's 5px `accent.primary`) |
| click | navigate, then close the dialog (existing behaviour) |

Focus and current-route were originally meant to share one ring; implementation
review overrode that. MUI's `FocusTrap` focuses the dialog container the moment
it opens, so the first Tab always lands on the Dashboard tile — and on
`/desktop/wallet`, this app's default route, that tile is also the current one.
A shared ring made that first Tab produce a pixel-identical `box-shadow`, i.e.
no visible focus indicator at all (WCAG 2.4.7). Giving focus its own ring means
the two states compose instead of collapsing into one: a focused non-current
tile gains an obvious new ring, and a focused current tile visibly thickens and
recolours rather than staying identical to its unfocused self.

Transitions are 160ms, matching the existing card, and are removed entirely under
`prefers-reduced-motion: reduce`.

Escape and backdrop dismissal are unchanged — they come from `Dialog`.

## Accessibility

- The tooltip is MUI `Tooltip`, the same component `AppTopBar` already uses, so
  placement, delay, and dismissal behave identically across the shell. It opens
  on focus as well as hover, which `Tooltip` does by default — keyboard users get
  the description without a pointer.
- The description is also bound with `aria-describedby`, so it reaches assistive
  tech without requiring any interaction at all. The shell is desktop-only, so
  hover is a reasonable *visual* affordance, but it must not be the only path to
  the text.
- The glyph is `aria-hidden`; the visible label is the accessible name.
- Tab order follows reading order, which is now the same as visual order — a
  property the three-shelf layout did not guarantee once shelves wrapped.

## Navigation module cleanup

`TOP_TABS` currently reaches into the group arrays by index, with casts:

```ts
export const TOP_TABS: Destination[] = [
  WALLET[0] as Destination,
  WALLET[1] as Destination,
  MARKETS[0] as Destination,
  MARKETS[1] as Destination,
];
```

Those casts exist only because the destinations are trapped inside array
literals. Going flat lets each become a named const that both `LAUNCHER_TILES`
and `TOP_TABS` reference by name, deleting four casts and the positional
coupling — a change in `WALLET`'s order can currently retitle the top bar
silently.

`LAUNCHER_GROUPS` has exactly two consumers (`AppLauncher` and its test) and no
role once the grid is flat, so it goes.

`Destination` gains one required field:

```ts
export interface Destination {
  // …existing fields
  hue: AppTileHue;
}
```

Required rather than optional, so a new destination cannot be added without
choosing a hue.

## Tile order and hue assignment

Ordered most-used first, which is the ordering a flat grid needs once category
grouping is gone.

| # | destination | hue |
|---:|---|---|
| 1 | Dashboard | indigo |
| 2 | Trade | green |
| 3 | Swap | teal |
| 4 | Portfolio | violet |
| 5 | Markets | blue |
| 6 | Transactions | slate |
| 7 | Order book | amber |
| 8 | Bridge | rose |
| 9 | Leasing | teal |
| 10 | Aliases | violet |
| 11 | Account manager | green |
| 12 | Create token | amber |
| 13 | Analytics | blue |
| 14 | Messages | slate |
| 15 | Settings | indigo |

Seven hues are used twice, `rose` once. Verified: no two tiles sharing a hue are
orthogonally adjacent at 3, 4, or 7 columns.

## Testing

New and changed tests, all in `layouts/shell/__tests__/`:

1. **Hue contrast, table-driven** over 8 hues × 2 modes: `on` vs `fill` ≥ 4.5:1,
   and `fill` vs `surface.base` ≥ 3:1.
2. **Adjacency**: for each of the three pinned column counts, no two
   orthogonally-adjacent tiles share a hue. This is what keeps the pinned
   breakpoints and the hue table honest with each other — change either and the
   test fails.
3. **Every destination declares a valid hue** — a runtime check to back the type,
   so a bad value from a future refactor fails loudly.
4. **All fifteen render**, and the count matches `LAUNCHER_TILES`.
5. **Current route** carries `aria-current="page"` and the ring treatment.
6. **Description reachable** via `aria-describedby` without a hover event.
7. `noRawColours` needed a targeted change, not none: five of the eight hue
   names this spec chose (`indigo`, `violet`, `teal`, `green`, `blue`) are
   themselves CSS named colours, so `hue: 'indigo'` in `navigation.tsx`
   false-positived under the lint's colon-based value matcher — it cannot tell
   a role reference from a literal by text alone. The fix is a narrow,
   textual exemption (`HUE_ROLE_VALUE` in `noRawColours.test.ts`) that blanks
   only a `hue:` key holding one of the eight `AppTileHue` union members,
   scoped to `layouts/shell/navigation.tsx` — the one file that assigns
   `Destination.hue` — before the raw-colour checks run on the rest of the
   line. The type checker, not this lint, is what keeps that field inside the
   closed eight-name union. The evidence of correctness is no longer "the test
   still passes unmodified"; it is the fixture table in `noRawColours.test.ts`
   (`describe('the hue-role exemption catches everything it should')`), which
   pins the exemption in both directions — a `hue:` role value is exempted
   only inside `navigation.tsx`, and the identical text on any other file, or
   any other colour-bearing property on the same line, is still flagged.

The existing `AppLauncher.contrast.test.tsx` is rewritten rather than extended:
it asserts against card/plate roles that stop existing.

## Scope

**In:** the desktop launcher (`layouts/shell/`), the `appTile` token family, the
`navigation.tsx` changes above.

**Out:**

- **Mobile.** `MobileHome` has its own shell and its own `MobileQuickActions`.
  Applying the tile language there is a separate sub-project — the mobile shell
  was only just pinned to the theme mode and should settle first.
- **The top bar.** It keeps its track-and-pill treatment. Nothing in this change
  requires it to move, and changing both surfaces at once would make a
  regression hard to attribute.
- **The other fourteen pages.** Later sub-projects.

## Risks

- **Eight fills is eight more things that can drift.** Mitigated by the
  table-driven contrast test: adding or editing a hue without clearing both modes
  fails the build.
- **A flat grid loses the category scent** the shelves provided. Accepted
  deliberately; the tooltip carries the description that the shelf heading used
  to imply, and fifteen is still small enough to scan.
- **`indigo` doubles as `accent.primary`.** If the brand accent ever changes,
  `appTile.indigo` moves with it. That is intended — the alternative is a
  near-copy that silently diverges — but it should be a conscious edit, so the
  token carries a comment saying so.
