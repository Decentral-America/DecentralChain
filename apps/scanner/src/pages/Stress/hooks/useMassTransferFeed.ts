import { useQuery } from '@tanstack/react-query';

const POLL_INTERVAL = 5_000;

const DATA_SERVICE_URL =
  typeof window === 'undefined'
    ? (process.env.DCC_DATA_SERVICE_URL ?? 'https://testnet-data-service.decentralchain.io/v0')
    : (window.__DCC_CONFIG__?.dataServiceUrl ??
      'https://testnet-data-service.decentralchain.io/v0');

export interface MassTransferEntry {
  id: string;
  timestamp: number;
  sender: string;
  transfers: Array<{ recipient: string; amount: number }>;
  totalAmount: number;
  height: number;
  applicationStatus?: string;
}

interface DataServiceResponse {
  data: Array<{
    data: {
      id: string;
      timestamp: number | string;
      sender: string;
      transfers: Array<{ recipient: string; amount: number }>;
      totalAmount?: number;
      height: number;
      applicationStatus?: string;
    };
  }>;
}

async function fetchMassTransferFeed(): Promise<MassTransferEntry[]> {
  const res = await fetch(`${DATA_SERVICE_URL}/transactions/mass-transfer?limit=20&sort=desc`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as DataServiceResponse;
  return (json.data ?? []).map((item) => {
    const tx = item.data;
    const totalAmount = tx.totalAmount ?? tx.transfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      applicationStatus: tx.applicationStatus,
      height: tx.height,
      id: tx.id,
      sender: tx.sender,
      timestamp: typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : tx.timestamp,
      totalAmount,
      transfers: tx.transfers,
    };
  });
}

export function useMassTransferFeed() {
  return useQuery<MassTransferEntry[]>({
    queryFn: fetchMassTransferFeed,
    queryKey: ['stress', 'mass-transfer-feed'],
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 500,
  });
}
