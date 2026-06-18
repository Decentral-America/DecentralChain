import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Radio, Users, Wifi } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchConnectedPeers, type IAllConnectedResponse } from '@/lib/api';
import { useChainPulse } from '../hooks/useChainPulse';
import { useMempoolSize } from '../hooks/useMempoolSize';

function SecondsBadge({ seconds }: { seconds: number }) {
  let color = 'text-green-500';
  if (seconds >= 30) color = 'text-red-500';
  else if (seconds >= 10) color = 'text-yellow-500';

  return <span className={`font-bold text-2xl ${color}`}>{seconds}s ago</span>;
}

export function ChainPulse() {
  const { data: pulse, isLoading: pulseLoading } = useChainPulse();
  const { data: mempool, isLoading: mempoolLoading } = useMempoolSize();
  const { data: peers } = useQuery<IAllConnectedResponse>({
    queryFn: () => fetchConnectedPeers(),
    queryKey: ['stress', 'connected-peers'],
    refetchInterval: 10_000,
    staleTime: 9_000,
  });

  const prevHeight = useRef<number>(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (pulse.height > 0 && pulse.height !== prevHeight.current) {
      prevHeight.current = pulse.height;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [pulse.height]);

  const peerCount = peers?.peers?.length ?? 0;

  return (
    <Card className="border-none shadow-lg h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="w-4 h-4 text-green-500 animate-pulse" />
          Chain Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Block Height */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Block Height
          </p>
          {pulseLoading && pulse.height === 0 ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <p
              className={`text-4xl font-bold tabular-nums transition-colors duration-300 ${
                flash ? 'text-green-500' : 'text-foreground'
              }`}
            >
              {pulse.height.toLocaleString()}
            </p>
          )}
        </div>

        {/* Blocks per minute */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Blocks / Minute
          </p>
          {pulseLoading && pulse.blocksPerMinute === 0 ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">
              {pulse.blocksPerMinute.toFixed(2)}
            </p>
          )}
        </div>

        {/* Mempool */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Mempool (unconfirmed)
          </p>
          {mempoolLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{mempool?.size ?? 0}</p>
          )}
        </div>

        {/* Peers */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Users className="w-3 h-3" />
            Connected Peers
          </p>
          <p className="text-2xl font-semibold tabular-nums">{peerCount}</p>
        </div>

        {/* Last block time */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last Block
          </p>
          {pulseLoading && pulse.secondsSinceLastBlock === 0 ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <SecondsBadge seconds={pulse.secondsSinceLastBlock} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
