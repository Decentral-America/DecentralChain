# Create Wallet Wizard — Design

**Date:** 2026-08-18
**App:** `apps/exchange`
**Status:** Approved, ready for implementation planning

## Problem

The Create New Wallet screen puts eleven distinct things in one card: title, import link,
Ledger call-to-action, divider, warning banner, fifteen seed words, four storage reminders,
two password fields, a confirmation checkbox and a submit button. The card overflows the
viewport, so the user scrolls through the single most security-critical flow in the product.

It also reads as a different product from the page it sits on. The left column is the dark
brand canvas; the right column is a plain white card with an orange warning box that belongs
to no other surface in the app.

Two problems underneath the visual one:

- **The confirmation is theatre.** A single "I have written down my seed phrase" checkbox is
  the only thing between a user and permanently losing access to their funds.
- **The seed is visible by default**, so a screenshare or a passer-by captures it before the
  user has decided they are ready to look at it.

## Decisions

Four decisions were taken during brainstorming and are settled:

| Decision | Choice |
|---|---|
| Card treatment | Dark translucent glass, and convert the sibling pre-app screens to match |
| Flow shape | Four steps, with real seed verification replacing the checkbox |
| Animation | MUI's built-in transitions — zero added bundle weight |
| Mobile | One shared responsive wizard, plus phone-specific polish |

The dark-glass choice deliberately overrides the convention documented in `AuthScene`
("light cards float on the dark field as the brightest thing in view"). That docstring must
be rewritten as part of this work, or it will describe a convention the code no longer
follows.

## Scope

Five live components render the light card in a pre-app context. Two others
(`PasswordProtection`, `AccountSwitcher`) have no consumers at all and are out of scope —
see Deferred.

**Phase 1 — the wizard**

| Component | Screen | Change |
|---|---|---|
| `CreateAccount` | `/signup` | Rebuilt as a four-step wizard |

**Phase 2 — surface conversion, no logic change**

| Component | Screen |
|---|---|
| `LoginForm` (and `AccountSelectScreen`, which it renders) | `/signin` |
| `ImportAccount` | `/import-account` |
| `SeedBackup` | `/save-seed` |

Phase 2 starts only after the surface has proven itself on the wizard.

## Architecture

A purpose-built wizard plus two extracted primitives. A generic reusable wizard engine was
rejected: only one flow needs it, and an API designed against a single consumer is guesswork.
Adding step state to the existing 524-line `CreateAccount` was rejected because that file
would reach roughly 800 lines with seed logic and four screens' markup interleaved.

```
components/auth/
  GlassCard.tsx          the dark translucent surface — the piece phase 2 reuses
  StepRail.tsx           step progress indicator

features/auth/create-wallet/
  CreateWalletWizard.tsx container: owns step index, renders the active step
  useCreateWallet.ts     state, Seed generation, auth calls, validation
  verification.ts        pure challenge generator (testable without rendering)
  steps/
    ChooseMethodStep.tsx
    RecoveryPhraseStep.tsx
    VerifyStep.tsx
    SecureStep.tsx
```

Each step receives its data and callbacks as props and renders no business logic. All
Seed/auth interaction lives in `useCreateWallet`, so the steps stay presentational and the
hook can be tested on its own.

## The surface — `GlassCard`

```
background:   rgba(255, 255, 255, 0.04)   over brandInk.night
backdrop:     blur(20px) saturate(140%)
border:       1px solid rgba(255, 255, 255, 0.10)
top edge:     inset 0 1px 0 rgba(255,255,255,0.14)   the lit rim that reads as glass
radius:       20px
shadow:       0 24px 60px rgba(6, 3, 20, 0.55)
```

Accents come from the existing `palette.indigoHover` and `brandInk.violet` so the card
inherits the landing page's palette rather than introducing a second one.

The orange warning box is removed. Danger copy becomes a violet-bordered inset panel with a
shield icon — same information, same prominence, without importing a foreign design language
into the brand surface.

`GlassCard` must degrade honestly where `backdrop-filter` is unsupported: fall back to an
opaque `brandInk.deep` background so text contrast is never left to chance.

## The four steps

### 1 — Choose method

Two selectable tiles, Ledger and seed phrase, replacing today's blue banner plus "OR CONTINUE
WITH SEED PHRASE" divider. Selecting Ledger routes to the existing `/import/ledger` flow;
selecting seed phrase advances to step 2.

### 2 — Your recovery phrase

Fifteen words in a 5x3 grid, revealed with a staggered fade.

The grid is **blurred until the user opts to reveal it**. This is a deliberate behaviour
change: the seed should not be on screen before the user has decided they are ready for it.

The reveal is an explicit click on the blurred grid, which carries an eye icon and the label
"Tap to reveal". It is one-way — once revealed the phrase stays visible for the rest of the
step, because re-hiding it would only obstruct someone mid-transcription. The copy button
works whether or not the phrase has been revealed.

A copy button remains. The four storage reminders collapse to one line of guidance — they
currently consume more vertical space than the seed itself.

### 3 — Verify

Three challenges. Each names a position ("word #7") and offers four candidates: the correct
word plus three decoys drawn from the same seed.

- Correct: the tile locks green and the wizard auto-advances to the next challenge.
- Wrong: the tile shakes. No lockout, no penalty, no attempt counter.
- All three correct is the only path to step 4.

Rules for the generator, which `verification.ts` owns and tests cover:

- three distinct positions
- the correct word always present among the candidates
- decoys never duplicate the correct word
- decoys drawn from the same seed, so the choice cannot be made by vocabulary alone

### 4 — Secure

Password and confirmation with a live strength meter, then wallet creation.

## Viewport

**Every step fits within a 600px viewport height.** This is the constraint the current
single-card layout breaks and the primary reason for splitting the flow. Only step 2 carries
real height, and 15 words in a 5x3 grid fits comfortably.

## Motion

MUI's bundled transitions only — no new dependency, and MUI is already on the critical path.

| Element | Treatment |
|---|---|
| Step change | `Slide` + `Fade`, direction reversing on back-navigation |
| Verify tiles | `Grow` |
| Seed words | CSS `animation-delay` stagger, matching the existing `Reveal` idiom |
| Wrong answer | CSS keyframe shake |
| Progress rail | CSS width transition |

A single `prefers-reduced-motion` media query disables all of it.

## Mobile

One shared wizard, responsive rather than forked. Phone-specific treatment:

- seed grid reflows from 5 columns to 3, then 2 (15 words, so the final row is short)
- sticky bottom action bar
- 48px minimum tap targets
- swipe back to completed steps

`MobileAuthScreen` keeps its shell; the wizard supplies its own progress rail.

## Error handling

Every failure renders inline within the active step. There must be no state in which a
generated seed is lost to an error screen.

| Failure | Behaviour |
|---|---|
| Seed generation fails | Error in step 2 with retry; no advance |
| Password weak or mismatched | Inline validation in step 4; submit disabled |
| Wallet creation fails | Error in step 4, form state preserved, retry available |

## Testing

- `verification.ts`: correct word always present, decoys never duplicate it, three distinct
  positions, generator stable for a given seed
- `useCreateWallet`: password validation, step guards (cannot reach step 4 without passing
  verification)
- Step navigation: forward, back, and that back-navigation preserves entered state

The existing 418 tests must stay green. Verification runs on Node 24.18.0 (`.node-version`):
`tsc -b --noEmit`, `vitest run`, `biome check .`, `vite build`.

## Deferred

- **Phase 2 surface conversion** of the four sibling screens, after the wizard ships.
- **`PasswordProtection` (325 lines) and `AccountSwitcher` (243 lines)** have no consumers.
  Flagged as dead; deletion is a separate decision.
- **Success screen.** An animated confirmation after creation was considered and dropped —
  the flow ends by entering the wallet, which is its own confirmation.
