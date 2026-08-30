# @dcc-amm/sdk

Quoting, transaction building, and pool state reads for the DCC AMM swap
protocol — a constant-product AMM running on two RIDE contracts:

| | Address |
|---|---|
| PoolCore | `3DcZHm89byJjfdkHTJ9m89pyeMk8vChDGtD` |
| SwapRouter | `3Dc9mKvihe2ujkk7co5oA2HnUJ9W1CGQsYg` |

No dependency on `@decentralchain/transactions` or any signing library — it
only reads via `fetch` and returns plain, unsigned `InvokeScriptTx` objects
for the caller to sign with whatever wallet/signer they use (e.g. this repo's
own `@decentralchain/transactions`).

```ts
import { AmmSdk, toRawAmount } from '@dcc-amm/sdk';

const sdk = new AmmSdk({
  nodeUrl: 'https://mainnet-node.decentralchain.io',
  dAppAddress: '3DcZHm89byJjfdkHTJ9m89pyeMk8vChDGtD',
  routerAddress: '3Dc9mKvihe2ujkk7co5oA2HnUJ9W1CGQsYg',
  chainId: '?',
});

const quote = await sdk.quoteSwap(toRawAmount('1', 8), null, someAssetId, 35, 50n);
const { tx } = await sdk.buildSwap(toRawAmount('1', 8), null, someAssetId, 35, 50n);
// sign `tx` with @decentralchain/transactions' invokeScript(), then broadcast
```

See `/Users/dylanshilts/dcc-amm-swap/docs/FRONTEND_INTEGRATION_HANDOFF.md` (a
sibling AMM-swap repo this package was ported from) for the full integration
guide, gotchas, and indexer API reference for stats/history.

## Origin

Ported from [`dcc-amm-swap`](https://github.com/dylanpersonguy/dcc-amm-swap)'s
`amm-core` + `amm-sdk` packages on 2026-08-29, folded into one package since
this is currently the only consumer. The swap math went through a security
audit in that repo before this port — `src/core/` is pure protocol math with
no network calls, safe to read/review independently of the rest.

## What changed from the original

- Merged `amm-core` (pure math/constants) into `src/core/` — was a separate
  package there, folded in here since nothing else in this repo consumes it
  standalone. Split it back out if that changes.
- CommonJS → ESM, to match this repo's module system.
- Adapted to this repo's stricter `tsconfig.base.json`
  (`verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
  — a handful of `import type` splits and two `as [string, ...]` tuple
  assertions after already-checked `.split()` results, no logic changes.
- Tests ported from Jest to Vitest (`describe`/`it`/`expect`/`vi` — same
  shape, `jest.fn()` → `vi.fn()`, one inline `require()` hoisted to a static
  import).
- `private: true`, no `publint`/`attw`/`size-limit`/`funding` boilerplate —
  this isn't published externally (unlike this repo's other `packages/sdk/*`
  packages). Add that back if it ever should be.

## Known lint warning, left as-is

`node-client.ts`'s `getPoolState()` trips `noExcessiveCognitiveComplexity`
(20 vs. max 15) — flat state-key mapping logic ported unchanged from the
original, already covered by tests. Didn't refactor working, tested
financial-logic code just to satisfy a complexity threshold; worth revisiting
if someone's touching that function anyway.
