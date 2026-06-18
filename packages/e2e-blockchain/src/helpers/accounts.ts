import { broadcast, transfer, waitForTx } from '@decentralchain/transactions';
import { address, publicKey, randomSeed } from '@decentralchain/ts-lib-crypto';

export interface Account {
  seed: string;
  address: string;
  publicKey: string;
}

/**
 * Derives a deterministic account from a seed phrase.
 */
export function deriveAccount(seed: string, chainId: string): Account {
  return {
    address: address(seed, chainId),
    publicKey: publicKey(seed),
    seed,
  };
}

/**
 * Creates a fresh random account (not yet funded).
 */
export function randomTestAccount(chainId: string): Account {
  const seed = randomSeed();
  return deriveAccount(seed, chainId);
}

/**
 * Transfers `amount` Decimalons from `from` to `to`, waits for confirmation.
 * Returns the confirmed transaction info.
 */
export async function fundAccount(
  to: string,
  amount: number,
  from: string,
  apiBase: string,
  chainId: string,
): Promise<{ id: string; height: number }> {
  const tx = transfer({ amount, chainId, recipient: to }, from);
  await broadcast(tx, apiBase);
  return waitForTx(tx.id, { apiBase, timeout: 120_000 });
}
