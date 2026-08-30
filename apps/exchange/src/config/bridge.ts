/**
 * Solana ⇄ DecentralChain Bridge Configuration
 *
 * The bridge contracts and validators are live on mainnet and handle settlement.
 * This app builds two transactions — one Solana deposit, one DecentralChain
 * `burnToken` withdrawal — and reads status. It signs nothing on the user's
 * behalf, holds no keys, and runs no relayer.
 *
 * Spec: docs/superpowers/specs/2026-08-29-solana-bridge-integration-handoff.md
 */

/**
 * On-chain addresses. Deliberately plain constants rather than environment
 * variables: every one of these can be read off the blockchain by anyone, so
 * an env var would imply a secrecy that does not exist. `VITE_`-prefixed
 * values are not secrets either — the prefix means "bake this into the public
 * bundle" — and pretending otherwise is how the RPC key leaked.
 */
export const SOLANA_PROGRAM_ID = '9yJDb6VyjDHmQC7DLADDdLFm9wxWanXRM5x9SdZ3oVkF';
export const BRIDGE_CONFIG_PDA = 'Fn4CxJ47wbTy4cuGZBf1a1p9ncAfWrjgjpqcdVR3eY1M';
export const NATIVE_VAULT_PDA = 'A2CMs9oPjSW46NvQDKFDqBqxj9EMvoJbTKkJJP9WK96U';
export const DCC_BRIDGE_CONTRACT = '3DhoNpsnwnv4kgnQbjzYxL9MsSo2bQ4qvLH';
export const DCC_NODE_URL = 'https://mainnet-node.decentralchain.io';
export const API_BASE = 'https://api-production-c9a68.up.railway.app/api/v1';

/**
 * The path the browser actually requests.
 *
 * CORS is a rule browsers enforce on themselves: a page may not read a
 * response from another origin unless that origin names it in
 * `Access-Control-Allow-Origin`. The bridge API names only its three deployed
 * front ends, so a request from `localhost` is fetched successfully and then
 * discarded by the browser before our code sees it. Nothing on this side can
 * change that — the header has to come from the API.
 *
 * In development the request therefore goes to a path on our own origin, which
 * the Vite dev server forwards to the API (see `server.proxy` in
 * `vite.config.ts`). That hop is Node talking to Railway — no browser, so no
 * CORS — and the response comes back same-origin.
 *
 * In production the browser calls the API directly and the allowlist governs
 * normally. Which means the proxy hides a misconfigured `ALLOWED_ORIGINS`:
 * local development will work while a deployed origin is still missing. Check
 * the list before any staging or production deploy; the proxy is not a
 * substitute for it.
 */
export const API_CLIENT_BASE = import.meta.env.DEV ? '/bridge-api/api/v1' : API_BASE;

/** Mainnet chain id character, byte 63. The bridge exists on mainnet only. */
export const DCC_CHAIN_ID_CHAR = '?';

/** DecentralChain transaction fee for `burnToken`, in wavelets (0.009 DCC). */
export const WITHDRAW_TX_FEE = 900_000;

/** Bridge withdrawal fee, deducted from the amount. */
export const WITHDRAW_FEE_RATE = 0.0025;

/**
 * A DecentralChain address is version(1) · chainId(1) · hash(20) · checksum(4),
 * right-padded with zeros into the contract's 32-byte field.
 */
export const DCC_ADDRESS_BYTES = 26;
export const RECIPIENT_FIELD_BYTES = 32;

/** Byte offset of the little-endian u64 nonce within a `UserState` account. */
export const USER_STATE_NONCE_OFFSET = 40;

/**
 * Registered on chain but unusable, so never offered in the UI.
 *
 * The deposit minimum and maximum are raw values applied uniformly to every
 * asset. For 8-decimal BTC that minimum is 0.01 BTC (~$780) and smaller
 * deposits are rejected; the same maximum caps BONK at roughly 283 tokens, so
 * any realistic amount fails with `DepositTooLarge`.
 *
 * These three report as *enabled* from `GET /tokens` — unlike the four assets
 * disabled on chain, which the API filters out for us. They must be excluded
 * here or the UI will offer a deposit that cannot succeed.
 *
 * Matched against the token's `name` field, which is what the API returns:
 * "Bitcoin", not "BTC". A ticker-shaped list silently matches nothing.
 */
export const BLOCKED_TOKEN_NAMES: readonly string[] = ['Bitcoin', 'BONK', 'cbBTC'];

/**
 * The daily mint cap is **one counter shared across every token**, accumulated
 * in raw Solana units — per `GET /deposit/limits`, source
 * `dcc_contract.max_daily_mint`. A deposit can therefore be rejected because
 * somebody else's deposit consumed the budget, with nothing wrong at all on
 * the user's side.
 *
 * Read the remaining headroom from the limits endpoint before submitting, and
 * say which limit bound when it fails. "Amount too large" is a misleading
 * message when the real answer is "the bridge is full until tomorrow".
 */
export const DAILY_CAP_IS_SHARED_ACROSS_TOKENS = true;

/**
 * Reads a required build-time value, throwing when it is absent.
 *
 * Vite inlines `import.meta.env` at build time — setting a variable on the
 * running container does nothing. A missing value silently falls back to
 * whatever default the source carries, and that default ships. On the
 * reference implementation the fallback was `http://127.0.0.1:8899`, compiled
 * into the public bundle, and every deposit failed for months.
 *
 * `scripts/checkBridgeEnv.js` runs the same check at build time so the failure
 * lands in CI rather than in a user's browser. This throw is the second line
 * of defence, for the case where a build skips that script.
 */
const requireEnv = (name: keyof ImportMetaEnv, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `${name} is required and was not set at build time. ` +
        'Vite inlines env values during the build; setting it on a running ' +
        'container has no effect. Rebuild with the value present.',
    );
  }
  return value;
};

/**
 * The one value here that is not public. The Solana RPC URL carries an API
 * key, so it must be domain-restricted in the Helius dashboard — the bundle
 * publishes it either way.
 */
export const SOLANA_RPC_URL = requireEnv(
  'VITE_SOLANA_RPC_URL',
  import.meta.env.VITE_SOLANA_RPC_URL,
);

/**
 * The RPC endpoint the browser actually connects to.
 *
 * Solana's public RPC answers server requests but returns 403 "Access
 * forbidden" to anything carrying a browser origin — a deliberate measure to
 * keep dapps off the shared endpoint. In development the connection therefore
 * goes through the dev server (`/solana-rpc` in `vite.config.ts`), which makes
 * it a server request again.
 *
 * Production connects directly, because a domain-restricted Helius key serves
 * browsers. As with `API_CLIENT_BASE`, that means local development exercises
 * a different path than production: a key that is missing, expired, or
 * restricted to the wrong domain will fail only once deployed.
 *
 * `web3.js` parses this with `new URL()`, so it must be absolute — hence
 * resolving against the page origin rather than passing a bare path.
 */
export const SOLANA_RPC_CLIENT_URL =
  import.meta.env.DEV && typeof window !== 'undefined'
    ? new URL('/solana-rpc', window.location.origin).toString()
    : SOLANA_RPC_URL;
