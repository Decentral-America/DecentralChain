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

/** Default request timeout in milliseconds (10 seconds). */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Calculates the recommended fee for a transaction by querying the node API.
 *
 * Falls back to the original transaction (with no fee change) if the
 * network call fails, ensuring resilience in offline or degraded scenarios.
 *
 * Security: enforces a request timeout and warns on non-HTTPS node URLs.
 *
 * @param baseUrl - The DecentralChain node base URL (e.g. `https://mainnet-node.decentralchain.io`)
 * @param tx - The unsigned transaction to calculate fees for
 * @returns The transaction with its `fee` field populated, or the original tx on failure
 */
export async function calculateFee(baseUrl: string, tx: SignerTx): Promise<SignerTx> {
  if (!baseUrl.startsWith('https://')) {
    console.warn(
      `[@decentralchain/provider-cubensis] Node URL is not HTTPS: ${baseUrl}. ` +
        'This is a security risk for financial transactions.',
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/transactions/calculateFee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
        signal: controller.signal,
      });

      if (!response.ok) {
        return tx;
      }

      const info = (await response.json()) as FeeInfo;
      return { ...tx, fee: info.feeAmount };
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return tx;
  }
}
