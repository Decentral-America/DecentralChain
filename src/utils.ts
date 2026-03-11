/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * Utility functions for the CubensisConnect provider.
 */

import { type SignerTx } from '@decentralchain/signer';

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
 * Type-guard that validates a parsed JSON response conforms to the
 * {@link FeeInfo} shape with a safe numeric `feeAmount`.
 *
 * Rejects NaN, Infinity, negative, zero, and non-integer values —
 * all of which would be invalid for a blockchain transaction fee.
 */
function isFeeInfo(value: unknown): value is FeeInfo {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const fee = obj['feeAmount'];
  return typeof fee === 'number' && Number.isFinite(fee) && Number.isInteger(fee) && fee > 0;
}

/**
 * Calculates the recommended fee for a transaction by querying the node API.
 *
 * Falls back to the original transaction (with no fee change) if the
 * network call fails, ensuring resilience in offline or degraded scenarios.
 *
 * Security notes:
 * - Enforces a request timeout to prevent hanging.
 * - Warns on non-HTTPS node URLs (financial data over plaintext).
 * - Validates the response shape and fee value before applying.
 *
 * @param baseUrl - The DecentralChain node base URL (e.g. `https://mainnet-node.decentralchain.io`)
 * @param tx - The unsigned transaction to calculate fees for
 * @returns The transaction with its `fee` field populated, or the original tx on failure
 */
export async function calculateFee(baseUrl: string, tx: SignerTx): Promise<SignerTx> {
  if (!baseUrl.startsWith('https://')) {
    console.warn(
      `[@decentralchain/cubensis-connect-provider] Node URL is not HTTPS: ${baseUrl}. ` +
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

      const info: unknown = await response.json();

      if (!isFeeInfo(info)) {
        console.warn(
          '[@decentralchain/cubensis-connect-provider] Invalid fee response from node — ' +
            'expected a positive integer feeAmount. Falling back to original tx.',
        );
        return tx;
      }

      return { ...tx, fee: info.feeAmount };
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return tx;
  }
}
