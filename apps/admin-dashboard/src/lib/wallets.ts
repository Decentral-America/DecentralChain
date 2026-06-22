import { readFileSync } from 'node:fs';
import { fetchBalanceDetails } from './api';

export interface WalletEntry {
  address: string;
  seed: string;
  publicKey: string;
}

export interface WalletBalance extends WalletEntry {
  available: number;
  generating: number;
  scanError?: string;
}

const DUST_THRESHOLD_WAVELETS = 1_000;
const TRANSFER_FEE_WAVELETS = 100_000;
const SCAN_BATCH_SIZE = 50;

export function readWalletCsv(csvPath: string): WalletEntry[] {
  const raw = readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) throw new Error('Wallet CSV is empty');

  // Detect header: actual CSV has 'seed' as first column (a hex string, not a DCC address).
  // DCC addresses start with '3'. Hex seeds are 64-char lowercase hex. Both differ from 'seed'.
  const firstField = lines[0]?.split(',')[0]?.trim() ?? '';
  const hasHeader = firstField === 'seed' || firstField === 'address' || firstField === 'publicKey';
  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Actual column order in real_wallets_2000_details.csv:
  //   seed,address,publicKey,privateKey
  // (confirmed from file header — do not reorder)
  return dataLines.map((line, i) => {
    const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 3)
      throw new Error(`Malformed CSV row ${i + 2}: expected at least 3 columns`);
    const seed = parts[0] ?? '';
    const address = parts[1] ?? '';
    const publicKey = parts[2] ?? '';
    return { address, publicKey, seed };
  });
}

export async function scanBalances(
  wallets: WalletEntry[],
  nodeUrl: string,
  signal?: AbortSignal,
): Promise<WalletBalance[]> {
  const results: WalletBalance[] = [];

  for (let i = 0; i < wallets.length; i += SCAN_BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = wallets.slice(i, i + SCAN_BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((w) => fetchBalanceDetails(nodeUrl, w.address)),
    );
    for (let j = 0; j < batch.length; j++) {
      const wallet = batch[j];
      const result = settled[j];
      if (!wallet || !result) continue;
      if (result.status === 'fulfilled') {
        results.push({
          ...wallet,
          available: result.value.available,
          generating: result.value.generating,
        });
      } else {
        results.push({
          ...wallet,
          available: 0,
          generating: 0,
          scanError: result.reason instanceof Error ? result.reason.message : 'scan failed',
        });
      }
    }
  }

  return results;
}

export function isFunded(wallet: WalletBalance): boolean {
  return wallet.available > DUST_THRESHOLD_WAVELETS;
}

export function sweepAmount(wallet: WalletBalance): number {
  return wallet.available - TRANSFER_FEE_WAVELETS;
}

export const TRANSFER_FEE = TRANSFER_FEE_WAVELETS;
