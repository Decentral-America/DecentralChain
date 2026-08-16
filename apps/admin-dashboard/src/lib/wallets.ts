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
