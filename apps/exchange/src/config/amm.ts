/**
 * DCC AMM configuration.
 *
 * A constant-product AMM (x·y=k) in two RIDE contracts: PoolCore holds all
 * state, SwapRouter is stateless and computes the swap before calling into
 * Core. Users invoke the Router, never Core.
 *
 * These are on-chain addresses — public by definition, so plain constants
 * rather than environment variables, matching `config/bridge.ts`.
 */

/** Holds reserves, LP supply, fee tier, pause flag. */
export const AMM_POOL_CORE = '3DcZHm89byJjfdkHTJ9m89pyeMk8vChDGtD';

/** Stateless. `swapExactIn` lives here. */
export const AMM_SWAP_ROUTER = '3Dc9mKvihe2ujkk7co5oA2HnUJ9W1CGQsYg';

export const AMM_NODE_URL = 'https://mainnet-node.decentralchain.io';

/** Mainnet chain id character, byte 63. Same as the bridge's. */
export const AMM_CHAIN_ID = '?';

/**
 * Default fee tier, in basis points. 35 = 0.35%.
 *
 * The whole fee stays in the pool for LPs — there is no protocol skim today.
 * `config:protocolFeePct` and `config:treasury` exist in contract state but
 * nothing reads them, so nothing here should present them as functional.
 */
export const AMM_DEFAULT_FEE_BPS = 35;

/** Default slippage tolerance, in basis points. 50 = 0.5%. */
export const AMM_DEFAULT_SLIPPAGE_BPS = 50n;

/** DCC's decimals. The native token, and 8 everywhere. */
export const DCC_DECIMALS = 8;

/**
 * Native DCC is the literal string `"DCC"`, not a base58 asset id.
 *
 * The SDK accepts `null` or `'DCC'` interchangeably for it, but not every
 * function does — normalise at the boundary rather than assuming.
 */
export const DCC_ASSET = 'DCC';

/**
 * Whether the AMM may be offered on this build's network.
 *
 * Every address above is a mainnet address and none derive from
 * `VITE_NETWORK`; the testnet node reports PoolCore as an invalid address and
 * no AMM is deployed on testnet or stagenet. Offering Swap there showed mainnet
 * pools as testnet ones and broadcast swaps against mainnet contracts. Gated on
 * the network, like `BRIDGE_SUPPORTED`, because the config is hardcoded and
 * therefore always present.
 */
export const AMM_SUPPORTED = import.meta.env.VITE_NETWORK === 'mainnet';
