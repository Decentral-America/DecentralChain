/**
 * DCC AMM Protocol Constants
 *
 * All numeric values are BigInt to match RIDE's 64-bit integer semantics.
 * No floating point is used anywhere in the protocol.
 */

/** Minimum liquidity permanently locked on first deposit (prevents share-price manipulation) */
export const MINIMUM_LIQUIDITY = 1000n;

/** Basis-point denominator (10000 = 100%) */
export const BPS_DENOMINATOR = 10000n;

/** Default fee in basis points (35 = 0.35%) */
export const DEFAULT_FEE_BPS = 35n;

/** Minimum allowed fee in basis points (1 = 0.01%) */
export const MIN_FEE_BPS = 1n;

/** Maximum allowed fee in basis points (1000 = 10%) */
export const MAX_FEE_BPS = 1000n;

/** RIDE Long max: 2^63 - 1 */
export const RIDE_MAX_INT = 9223372036854775807n;

/** Identifier for the native DCC token (null asset in DecentralChain) */
export const DCC_ASSET_ID = 'DCC';

/** LP token decimal places (for display — LP is state-tracked in v2) */
export const LP_DECIMALS = 8;

/** LP token name prefix (legacy — LP is state-tracked in v2) */
export const LP_TOKEN_PREFIX = 'DCC-AMM-LP';

/** Virtual address for permanently locked LP */
export const LOCKED_LP_ADDR = 'LOCKED';
