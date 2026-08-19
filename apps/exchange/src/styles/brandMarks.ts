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
 * `Swap.tsx`'s token-avatar accents. Not an external trademark the way
 * `networkBrandColor` is — DCC is this app's own asset, and the USDT value
 * isn't its real brand teal (`#26A17B`) either — but both are fixed,
 * per-asset identity tints rather than a role in this app's own palette
 * (the whole point of `TokenField`'s `markColor` prop is to show each
 * asset's own hue, not the app's accent), and `Swap.contrast.test.tsx`
 * asserts these exact values, so neither is free to become theme-relative
 * without also rewriting what that test verifies. Preserved as-is, not
 * "corrected" — that would be a content decision beyond this lint's remit.
 */
export const swapMarkColor = {
  dcc: '#8A63D2',
  usdt: '#F7931A',
} as const;
