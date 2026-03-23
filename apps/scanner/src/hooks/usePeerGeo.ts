import { useQueries } from '@tanstack/react-query';
import { fetchGeoForIp, fetchGreenCheck, type GeoData, type GreenHostData } from '@/lib/api';

const ONE_DAY = 24 * 60 * 60 * 1000;

export interface PeerGeoResult {
  geo: GeoData | undefined;
  green: GreenHostData | undefined;
  isLoading: boolean;
}

/**
 * Extract the IP portion from a peer address string (format: "/ip:port").
 */
export function extractIp(address: string | undefined): string | undefined {
  if (!address) return;
  return address.split('/')[1]?.split(':')[0];
}

/**
 * React Query-based geo enrichment for a list of unique IPs.
 *
 * Each IP gets its own cached query with a 24-hour staleTime,
 * so identical IPs across tabs/components share the same cache entry.
 * React Query's built-in deduplication prevents double-fetching.
 */
export function usePeerGeo(ips: string[]): Record<string, PeerGeoResult> {
  const geoQueries = useQueries({
    queries: ips.map((ip) => ({
      enabled: !!ip,
      gcTime: ONE_DAY,
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchGeoForIp(ip, signal),
      queryKey: ['peer-geo', ip] as const,
      retry: (failureCount: number, error: Error) => {
        // Don't retry rate limits
        if (error.message === 'RATE_LIMITED') return false;
        return failureCount < 2;
      },
      staleTime: ONE_DAY,
    })),
  });

  const greenQueries = useQueries({
    queries: ips.map((ip) => ({
      enabled: !!ip,
      gcTime: ONE_DAY,
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchGreenCheck(ip, signal),
      queryKey: ['peer-green', ip] as const,
      retry: 1,
      staleTime: ONE_DAY,
    })),
  });

  const result: Record<string, PeerGeoResult> = {};
  for (let i = 0; i < ips.length; i++) {
    const ip = ips[i];
    if (ip === undefined) continue;
    result[ip] = {
      geo: geoQueries[i]?.data,
      green: greenQueries[i]?.data,
      isLoading: (geoQueries[i]?.isLoading ?? false) || (greenQueries[i]?.isLoading ?? false),
    };
  }
  return result;
}
