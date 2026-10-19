import { libs } from '@decentralchain/transactions';

type Env = Readonly<Record<string, string | undefined>>;

/** Network byte from DCC_CHAIN_ID (33 = testnet '!'), or null when unset/invalid. */
export function faucetChainId(env: Env = process.env): number | null {
  const value = env.DCC_CHAIN_ID ? Number.parseInt(env.DCC_CHAIN_ID, 10) : Number.NaN;
  return Number.isInteger(value) ? value : null;
}

/** Public address of the faucet wallet, for balance monitoring. Never exposes the seed. */
export function faucetAddress(env: Env = process.env): string | null {
  const seed = env.DCC_FAUCET_SEED;
  const chainId = faucetChainId(env);
  if (!seed || chainId === null) return null;
  return libs.crypto.address(seed, chainId);
}
