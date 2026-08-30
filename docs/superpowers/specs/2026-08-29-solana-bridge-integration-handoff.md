# Bridge Integration Handoff · Solana ⇄ DecentralChain

> Supplied by the bridge team, 29 August 2026. This is the contract between the exchange frontend and a bridge that is already running. Implementation plan: `docs/superpowers/plans/2026-08-29-solana-bridge-integration.md`.
>
> **If an endpoint or account list disagrees with this document, the chain is correct and this document is stale.**

## 01 · What is being integrated

The bridge locks an asset on Solana and issues a wrapped version on DecentralChain, and reverses that on the way back. Three validators watch both chains and settle automatically. A deposit typically mints in about 30 seconds.

The frontend has three jobs and no others:

1. Show which assets are available and their current limits
2. Build and submit one Solana transaction to deposit
3. Build and submit one DecentralChain transaction to withdraw

It does not sign on behalf of users, hold keys, run a relayer, or track settlement. Once a deposit transaction confirms, the bridge takes over.

**Verified on mainnet.** Ten assets have completed a full round trip with real funds: SOL, USDC, USDT, JitoSOL, Jupiter, PYTH, Raydium, PENGU, RNDR, Ether. Three registered assets do not work — see section 07.

## 02 · Configuration

Everything a browser downloads is public. Framework prefixes like `VITE_`, `NEXT_PUBLIC_` and `REACT_APP_` do not protect anything — they are markers that say *bake this into the public bundle*.

### Safe to hardcode

These are on-chain addresses. Anyone can read them off the blockchain, so a plain constants file is more honest than environment variables.

```ts
// src/config/bridge.ts
export const SOLANA_PROGRAM_ID   = '9yJDb6VyjDHmQC7DLADDdLFm9wxWanXRM5x9SdZ3oVkF';
export const BRIDGE_CONFIG_PDA   = 'Fn4CxJ47wbTy4cuGZBf1a1p9ncAfWrjgjpqcdVR3eY1M';
export const NATIVE_VAULT_PDA    = 'A2CMs9oPjSW46NvQDKFDqBqxj9EMvoJbTKkJJP9WK96U';
export const DCC_BRIDGE_CONTRACT = '3DhoNpsnwnv4kgnQbjzYxL9MsSo2bQ4qvLH';
export const DCC_NODE_URL        = 'https://mainnet-node.decentralchain.io';
export const DCC_CHAIN_ID_CHAR   = '?';  // mainnet, byte 63
export const API_BASE            = 'https://api-production-c9a68.up.railway.app/api/v1';
```

### Not safe to hardcode

**Do not ship the RPC key.** The Solana RPC URL contains an API key. Putting it in the bundle publishes it — this has already happened once on the existing deployment. Pick one: restrict the key to your domain in the Helius dashboard, proxy RPC calls through the API, or use a public endpoint for testing only. Rotate the current key regardless.

### Before anything works

Add the app's origin to `ALLOWED_ORIGINS` on the API service. Until you do, every request fails CORS with no useful error in the console. Currently permitted:

- `https://bridge.decentralswap.com`
- `https://app.decentralswap.com`
- `https://frontend-production-d1ba1.up.railway.app`

## 03 · Reading state

Four endpoints. No authentication.

| Endpoint | Returns | Use it for |
|---|---|---|
| `GET /tokens` | Registered and enabled assets with decimals and wrapped asset ids | The asset picker. Never hardcode this list |
| `GET /deposit/limits?splMint=…` | Min and max in human units for that asset | Validate before the wallet prompt |
| `GET /transfer/:transferId` | Settlement status | Progress after a deposit |
| `GET /stats` | Vault balance, wrapped supply, collateralization | Dashboards, health display |

**Why not a hardcoded list.** Four assets are deliberately disabled on chain because they would lose user funds. `GET /tokens` reflects that within 30 seconds. A hardcoded list would keep offering them.

## 04 · Deposit · Solana to DecentralChain

One transaction. Two instruction shapes. Use the Anchor IDL at `target/idl/sol_bridge_lock.json` — it builds the instruction data for you. Both instructions take the same parameter struct:

```
DepositParams / DepositSplParams {
  recipient_dcc : [u8; 32]   // 26-byte DCC address, right-padded — see trap 01
  amount        : u64        // raw base units of the asset
  transfer_id   : [u8; 32]   // derived, see below
}
```

### Deriving `transfer_id`

Read the user's nonce from their `UserState` account at byte offset 40 (little-endian u64; the account may not exist yet, in which case the nonce is 0). Then:

```
transfer_id = sha256( senderPubkey.toBuffer() ++ u64LE(nonce) )
```

### PDA seeds

```
bridge_config        ['bridge_config']
user_state           ['user_state', senderPubkey]
deposit_record       ['deposit', transfer_id]
vault                ['vault']
mint_limits          ['mint_limits', splMint]                        // SPL only
vault_token_account  ATA(splMint, bridge_config, allowOwnerOffCurve: true)
sender_token_account ATA(splMint, senderPubkey)
```

### Accounts · `deposit` (native SOL)

| # | Account | Flags |
|---|---|---|
| 1 | `bridge_config` | mut |
| 2 | `user_state` | mut |
| 3 | `deposit_record` | mut |
| 4 | `vault` | mut |
| 5 | `sender` | mut · signer |
| 6 | `system_program` | — |

### Accounts · `deposit_spl` (every other asset)

| # | Account | Flags |
|---|---|---|
| 1 | `bridge_config` | mut |
| 2 | `user_state` | mut |
| 3 | `deposit_record` | mut |
| 4 | `spl_mint` | — |
| 5 | `mint_limits` | — · **easy to miss** |
| 6 | `sender_token_account` | mut |
| 7 | `vault_token_account` | mut |
| 8 | `sender` | mut · signer |
| 9 | `token_program` | — |
| 10 | `associated_token_program` | — |
| 11 | `system_program` | — |

After the transaction confirms, poll `GET /transfer/:transferId`. Nothing further is required from the app.

## 05 · Withdraw · DecentralChain to Solana

One invoke script. The user needs a DecentralChain wallet. The user calls `burnToken` on the bridge contract, attaching the wrapped asset as payment. Get the wrapped `assetId` from `GET /tokens`.

```ts
invokeScript({
  dApp:    '3DhoNpsnwnv4kgnQbjzYxL9MsSo2bQ4qvLH',
  chainId: '?',
  call: {
    function: 'burnToken',
    args: [
      { type: 'string', value: solanaRecipientAddress },  // base58 Solana pubkey
      { type: 'string', value: splMint },                 // the Solana mint
    ],
  },
  payment: [{ assetId: wrappedAssetId, amount: rawAmount }],
  fee: 900000,
})
```

**Fees the user pays.** A DecentralChain transaction fee of 0.009 DCC, plus a 0.25% withdrawal fee deducted from the amount. The user needs a small DCC balance or the burn will not broadcast. Surface this before they commit.

Settlement takes longer than a deposit — the validators gather attestations across several Solana transactions before releasing funds. Allow a few minutes and show progress rather than a spinner that looks stuck.

## 06 · Traps

Each of these cost real money or hours of debugging on the reference implementation. None produce an obvious error.

### The DCC address is exactly 26 bytes — never strip trailing zeros
*Silent · loses ~1 deposit in 256*

A DecentralChain address is version(1) · chainId(1) · hash(20) · checksum(4), right-padded with zeros to fill the 32-byte field. The obvious implementation trims trailing zeros to recover it. That eats a checksum byte that is legitimately `0x00`.

The result is a different, invalid address. Signature verification still passes, so the failure lands later inside the contract, the mint reverts, and the deposit is locked with no automatic recovery.

```ts
// correct — fixed-width slice
const raw = bs58.decode(dccAddress);
const field = Buffer.alloc(32);
Buffer.from(raw).copy(field, 0, 0, 26);
```

### `mint_limits` sits at position 5, mid-list
*Confusing · looks like a different bug*

It is inserted between `spl_mint` and `sender_token_account`, not appended. Omit it and every account after shifts by one, producing `AccountOwnedByWrongProgram (3007)` — which reads like a wrong-address bug, not a missing account.

### Wrapped decimals can differ from Solana decimals
*Silent · wrong amounts*

SOL and JitoSOL are 9 decimals on Solana and 8 on DecentralChain — a divisor of 10. Everything else is 1:1. Always take decimals from `GET /tokens` and convert per asset. Assuming they match displays balances that are wrong by 10×.

### Build-time config is baked, not read at runtime
*Silent · ships a broken build*

Vite, Next and CRA inline `import.meta.env` / `process.env` values at build time. Setting them on the running container does nothing. A missing value falls back to whatever the source default is — on the reference app that was `http://127.0.0.1:8899`, compiled into the public bundle, and every deposit failed for months.

Fail the build when a required value is absent rather than letting a fallback ship.

## 07 · What does not work

Do not offer these in the UI. The limitation is on chain, not in the app.

| Asset | Status | Why |
|---|---|---|
| Bitcoin, cbBTC | Blocked | Minimum deposit is a raw value applied to every asset, which for 8-decimal BTC means 0.01 BTC — roughly $780. Smaller deposits are rejected on chain. |
| BONK | Blocked | The same raw maximum caps BONK at roughly 283 tokens. Any realistic amount fails with `DepositTooLarge`. |
| DAI, tBTC, PYUSD, PUMP | Disabled | Deliberately disabled on chain. Wrong wrapped decimals, a mint address that never existed, and two Token-2022 mints the withdrawal path cannot pay out. |
| The other 10 | Round-tripped | Verified end to end on mainnet with real funds. |

Sourcing the asset list from `GET /tokens` handles the four disabled ones automatically. The three limit-blocked assets still appear as enabled — filter them yourself, or check the amount against `GET /deposit/limits` before enabling the submit button.

## 08 · Order of work

Each step is verifiable before the next.

1. Add the app's origin to `ALLOWED_ORIGINS` on the API. Confirm `GET /stats` returns JSON from the app's origin.
2. Restrict or rotate the Helius key and decide how RPC reaches the browser.
3. Drop in the constants file. Render the asset list from `GET /tokens`.
4. Implement native SOL deposit only. Six accounts, no token program. Send one real deposit and watch it mint.
5. Add `deposit_spl`. Same shape plus five accounts — and `mint_limits` at position 5.
6. Add withdraw. Test with a small amount and confirm the tokens arrive on Solana.
7. Wire status polling and show the user where their transfer is.

**Before going live.** Do a real round trip with a small amount of one asset, in both directions, from the finished UI. Every serious bug on this bridge was found by moving actual funds — none of them by reading code.
