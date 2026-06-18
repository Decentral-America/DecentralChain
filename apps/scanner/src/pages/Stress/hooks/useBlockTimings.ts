import { useQuery } from '@tanstack/react-query';
import { fetchBlockHeadersSeq, fetchHeight } from '@/lib/api';

const POLL_INTERVAL = 5_000;

export interface BlockTiming {
  height: number;
  timestamp: number;
  tps: number;
  blockTimeMs: number;
}

export function useBlockTimings() {
  const { data: heightData } = useQuery<{ height: number }>({
    queryFn: () => fetchHeight(),
    queryKey: ['stress', 'height'],
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 500,
  });

  const currentHeight = heightData?.height ?? 0;

  const { data: headers, isLoading } = useQuery({
    enabled: currentHeight > 0,
    queryFn: () => fetchBlockHeadersSeq(Math.max(1, currentHeight - 19), currentHeight),
    queryKey: ['stress', 'block-timings', currentHeight],
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 500,
  });

  let timings: BlockTiming[] = [];

  if (headers && headers.length >= 2) {
    const sorted = [...headers].sort((a, b) => a.height - b.height);
    timings = sorted.slice(1).map((block, idx) => {
      const prev = sorted[idx];
      const blockTimeMs = prev ? block.timestamp - prev.timestamp : 0;
      const blockTimeSec = blockTimeMs / 1000;
      const txCount = block.transactionCount ?? 0;
      const tps = blockTimeSec > 0 ? txCount / blockTimeSec : 0;
      return {
        blockTimeMs,
        height: block.height,
        timestamp: block.timestamp,
        tps,
      };
    });
  }

  return { data: timings, isLoading: currentHeight > 0 && isLoading };
}
