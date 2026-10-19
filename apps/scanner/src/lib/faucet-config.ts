import { libs } from '@decentralchain/transactions';
import { logWarn } from '@/lib/error-logger';

type Env = Readonly<Record<string, string | undefined>>;

const DEFAULT_AMOUNT_DCC = 10;
const DEFAULT_RATE_HOURS = 24;

/** Network byte from DCC_CHAIN_ID (33 = testnet '!'), or null when unset/invalid. */
export function faucetChainId(env: Env = process.env): number | null {
  const raw = env.DCC_CHAIN_ID?.trim();
  // Digits only, like site.ts: parseInt would read "33abc" as 33 and sign the faucet for the wrong chain.
  if (!raw || !/^\d+$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  return value <= 255 ? value : null;
}

/** Last derivation, so /api/health does not derive keys on every request. */
let cachedAddress: { address: string; chainId: number; seed: string } | null = null;

/** Public address of the faucet wallet, for balance monitoring. Never exposes the seed. */
export function faucetAddress(env: Env = process.env): string | null {
  const seed = env.DCC_FAUCET_SEED;
  const chainId = faucetChainId(env);
  if (!seed || chainId === null) return null;
  if (cachedAddress?.seed !== seed || cachedAddress.chainId !== chainId) {
    cachedAddress = { address: libs.crypto.address(seed, chainId), chainId, seed };
  }
  return cachedAddress.address;
}

/** A positive finite number from `env[name]`; the fallback (with a warning) when it is not one. */
function positiveSetting(env: Env, name: string, fallback: number): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) return value;
  logWarn(`${name} must be a positive number; using the default ${fallback}`, { value: raw });
  return fallback;
}

/** Per-request amount (whole DCC) and per-address window (hours). */
export function faucetSettings(env: Env = process.env): { amountDcc: number; rateHours: number } {
  return {
    amountDcc: positiveSetting(env, 'DCC_FAUCET_AMOUNT', DEFAULT_AMOUNT_DCC),
    rateHours: positiveSetting(env, 'DCC_FAUCET_RATE_HOURS', DEFAULT_RATE_HOURS),
  };
}
