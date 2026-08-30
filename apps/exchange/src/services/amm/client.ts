/**
 * The AMM SDK, configured once.
 *
 * Talks to the node and the two contracts directly — no indexer involved in
 * quoting or swapping. The indexer exists for volume and history, which this
 * page does not need.
 */
import { AmmSdk } from '@dcc-amm/sdk';
import { AMM_CHAIN_ID, AMM_NODE_URL, AMM_POOL_CORE, AMM_SWAP_ROUTER } from '@/config/amm';

let instance: AmmSdk | null = null;

export const getAmmSdk = (): AmmSdk => {
  instance ??= new AmmSdk({
    chainId: AMM_CHAIN_ID,
    dAppAddress: AMM_POOL_CORE,
    nodeUrl: AMM_NODE_URL,
    routerAddress: AMM_SWAP_ROUTER,
  });
  return instance;
};

/**
 * Whether a mined transaction's script actually did anything.
 *
 * `waitForTx` resolving only means the transaction was mined. A callable's own
 * `must(...)` check can still fail at script-execution time: the transaction
 * is mined, the fee is charged, state is unchanged, and the failure is
 * reported in `applicationStatus` rather than by anything throwing. Treating a
 * mined transaction as a successful swap is how a user is told their trade
 * went through when it did not.
 */
export const getApplicationStatus = async (txId: string): Promise<string | null> => {
  try {
    const response = await fetch(`${AMM_NODE_URL}/transactions/info/${txId}`);
    if (!response.ok) return null;

    const body = (await response.json()) as { applicationStatus?: string };
    return body.applicationStatus ?? null;
  } catch {
    return null;
  }
};

/** Polls until the node knows the transaction, then reports whether it succeeded. */
export const confirmApplied = async (
  txId: string,
  { attempts = 20, intervalMs = 3000 } = {},
): Promise<{ applied: boolean; status: string | null }> => {
  for (let i = 0; i < attempts; i++) {
    const status = await getApplicationStatus(txId);
    if (status) {
      return { applied: status === 'succeeded', status };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { applied: false, status: null };
};
