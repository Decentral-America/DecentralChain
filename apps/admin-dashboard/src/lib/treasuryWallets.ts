import { address, publicKey, randomSeed } from '@decentralchain/ts-lib-crypto';
import { getSql } from './db';
import { type WalletEntry } from './wallets';

export interface GeneratedWallet extends WalletEntry {
  id: string;
}

/**
 * Generates `count` fresh wallets in memory — never read from an external file.
 * Each fund call gets its own batch id so these can be inserted, funded, and
 * later identified as a group if needed (e.g. for a future per-run sweep).
 */
export function generateWallets(count: number, chainId: string): GeneratedWallet[] {
  const wallets: GeneratedWallet[] = [];
  for (let i = 0; i < count; i++) {
    const seed = randomSeed();
    wallets.push({
      address: address(seed, chainId),
      id: crypto.randomUUID(),
      publicKey: publicKey(seed),
      seed,
    });
  }
  return wallets;
}

/** Persists a freshly generated batch before funding, so a crash mid-fund never loses track of a wallet. */
export async function insertFundedWallets(
  wallets: GeneratedWallet[],
  fundBatchId: string,
  amountWavelets: number,
  fundedTxId: string | null,
  createdBy: string,
): Promise<void> {
  if (wallets.length === 0) return;
  const sql = getSql();
  await sql`
    INSERT INTO treasury_wallets ${sql(
      wallets.map((w) => ({
        address: w.address,
        created_by: createdBy,
        fund_batch_id: fundBatchId,
        funded_amount_wavelets: amountWavelets,
        funded_tx_id: fundedTxId,
        id: w.id,
        public_key: w.publicKey,
        seed: w.seed,
      })),
    )}
  `;
}

interface UnsweptRow {
  id: string;
  address: string;
  seed: string;
  public_key: string;
}

/** Every treasury-generated wallet that hasn't been swept back yet — the sweep target list. */
export async function getUnsweptWallets(): Promise<WalletEntry[]> {
  const sql = getSql();
  const rows = await sql<UnsweptRow[]>`
    SELECT id, address, seed, public_key FROM treasury_wallets WHERE swept_at IS NULL
  `;
  return rows.map((r) => ({ address: r.address, publicKey: r.public_key, seed: r.seed }));
}

/** Marks a swept wallet so the next sweep run doesn't try it again. */
export async function markSwept(
  address: string,
  sweptTxId: string | null,
  sweptAmountWavelets: number,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE treasury_wallets
    SET swept_at = now(), swept_tx_id = ${sweptTxId}, swept_amount_wavelets = ${sweptAmountWavelets}
    WHERE address = ${address} AND swept_at IS NULL
  `;
}
