/**
 * Third-party and per-asset identity colours.
 *
 * These are not this app's design decisions. `networkBrandColor` is each
 * network's actual, externally defined brand colour, paired with its real
 * brand icon (`cryptocurrency-icons`, see `Bridge.tsx`) — recolouring
 * Bitcoin's mark to match this app's violet theme would make it stop reading
 * as Bitcoin. Declared once here rather than inline so `Bridge.tsx` doesn't
 * invent its own copy and a future network can't drift from the pattern.
 */
export const networkBrandColor = {
  bnb: '#F0B90B',
  btc: '#F7931A',
  eth: '#627EEA',
  sol: '#14F195',
} as const;

/**
 * `Swap.tsx`'s USDT token-avatar accent. Not an external trademark the way
 * `networkBrandColor` is, and not USDT's real brand teal (`#26A17B`) either
 * — but it is a fixed, per-asset identity tint rather than a role in this
 * app's own palette (the whole point of `TokenField`'s `markColor` prop is
 * to show each asset's own hue, not the app's accent), and
 * `Swap.contrast.test.tsx` asserts this exact value, so it isn't free to
 * become theme-relative without also rewriting what that test verifies.
 * Preserved as-is, not "corrected" to USDT's real colour — that would be a
 * content decision beyond this lint's remit.
 *
 * Fix round 1: `dcc` used to live here too, but DCC is this app's own asset,
 * not a third-party brand — that entry was laundering an app colour through
 * the brand-mark exception. It now reads `accent.primary` directly at the
 * call site in `Swap.tsx`, mode-aware like every other DCC-branded surface
 * in the app, rather than a second, stale, hand-typed near-duplicate of it.
 */
export const swapMarkColor = {
  usdt: '#F7931A',
} as const;
