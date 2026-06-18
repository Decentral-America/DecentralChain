import { useQuery } from '@tanstack/react-query';
import { fetchBlockHeadersSeq, fetchHeight } from '@/lib/api';

const POLL_INTERVAL = 3_000;

export interface ChainPulseData {
  height: number;
  blocksPerMinute: number;
  lastBlockTimestamp: number;
  secondsSinceLastBlock: number;
}

export function useChainPulse() {
  const { data: heightData, isLoading: heightLoading } = useQuery<{ height: number }>({
    queryFn: () => fetchHeight(),
    queryKey: ['stress', 'height'],
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 500,
  });

  const currentHeight = heightData?.height ?? 0;

  const { data: headers, isLoading: headersLoading } = useQuery({
    enabled: currentHeight > 0,
    queryFn: () => fetchBlockHeadersSeq(Math.max(1, currentHeight - 9), currentHeight),
    queryKey: ['stress', 'pulse-headers', currentHeight],
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 500,
  });

  let blocksPerMinute = 0;
  let lastBlockTimestamp = 0;
  let secondsSinceLastBlock = 0;

  if (headers && headers.length >= 2) {
    const sorted = [...headers].sort((a, b) => a.height - b.height);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first && last) {
      lastBlockTimestamp = last.timestamp;
      secondsSinceLastBlock = Math.max(0, Math.floor((Date.now() - last.timestamp) / 1000));
      const spanMs = last.timestamp - first.timestamp;
      if (spanMs > 0) {
        blocksPerMinute = ((sorted.length - 1) / spanMs) * 60_000;
      }
    }
  } else if (headers && headers.length === 1 && headers[0]) {
    lastBlockTimestamp = headers[0].timestamp;
    secondsSinceLastBlock = Math.max(0, Math.floor((Date.now() - headers[0].timestamp) / 1000));
  }

  return {
    data: {
      blocksPerMinute,
      height: currentHeight,
      lastBlockTimestamp,
      secondsSinceLastBlock,
    } as ChainPulseData,
    isLoading: heightLoading || (currentHeight > 0 && headersLoading),
  };
}
