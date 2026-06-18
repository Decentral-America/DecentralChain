import { useQuery } from '@tanstack/react-query';

const POLL_INTERVAL = 3_000;

const DEFAULT_NODE_URL =
  typeof window === 'undefined'
    ? (process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io')
    : (window.__DCC_CONFIG__?.nodeUrl ?? 'https://testnet-node.decentralchain.io');

async function fetchMempoolSize(): Promise<{ size: number }> {
  const res = await fetch(`${DEFAULT_NODE_URL}/transactions/unconfirmed/size`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ size: number }>;
}

export function useMempoolSize() {
  return useQuery<{ size: number }>({
    queryFn: fetchMempoolSize,
    queryKey: ['stress', 'mempool-size'],
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 500,
  });
}
