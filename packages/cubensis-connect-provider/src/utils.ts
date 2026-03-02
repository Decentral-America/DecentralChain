/**
 * @module @decentralchain/provider-cubensis
 *
 * Utility functions for the CubensisConnect provider.
 */

import type { SignerTx } from '@decentralchain/signer';

/**
 * Response shape from the DecentralChain node fee calculation endpoint.
 */
interface FeeInfo {
  readonly feeAssetId: string | null;
  readonly feeAmount: number;
}

/**
 * Calculates the recommended fee for a transaction by querying the node API.
 *
 * Falls back to the original transaction (with no fee change) if the
 * network call fails, ensuring resilience in offline or degraded scenarios.
 *
 * @param baseUrl - The DecentralChain node base URL (e.g. `https://mainnet-node.decentralchain.io`)
 * @param tx - The unsigned transaction to calculate fees for
 * @returns The transaction with its `fee` field populated, or the original tx on failure
 */
export async function calculateFee(baseUrl: string, tx: SignerTx): Promise<SignerTx> {
  try {
    const response = await fetch(`${baseUrl}/transactions/calculateFee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });

    if (!response.ok) {
      return tx;
    }

    const info = (await response.json()) as FeeInfo;
    return { ...tx, fee: info.feeAmount };
  } catch {
    return tx;
  }
}
