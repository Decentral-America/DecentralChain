import { AlertTriangle, Clock, Gauge, Layers } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type BlockHeader, fetchBlockHeadersSeqPaginated, fetchHeight } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChainSnapshot {
  height: number;
  blocks: BlockHeader[];
  fetchedAt: number;
}

interface BlockTimeDatum {
  height: number;
  blockTimeS: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveBlockTimeSeries(blocks: BlockHeader[]): BlockTimeDatum[] {
  if (blocks.length < 2) return [];
  return blocks
    .slice(1)
    .map((b, i) => {
      const prev = blocks[i];
      if (!prev) return null;
      return {
        blockTimeS: Math.round((b.timestamp - prev.timestamp) / 1000),
        height: b.height,
      };
    })
    .filter((d): d is BlockTimeDatum => d !== null);
}

function computeTps(blocks: BlockHeader[], windowBlocks = 10): number {
  if (blocks.length < 2) return 0;
  const window = blocks.slice(-Math.min(windowBlocks, blocks.length));
  const first = window[0];
  const last = window[window.length - 1];
  if (!first || !last) return 0;
  const durationS = (last.timestamp - first.timestamp) / 1000;
  if (durationS <= 0) return 0;
  const txCount = window.reduce((s, b) => s + (b.transactionCount ?? 0), 0);
  return txCount / durationS;
}

function computeMempoolDepth(blocks: BlockHeader[]): number {
  // We don't have a direct mempool endpoint here; approximate from last block TX count
  // relative to average. Returns the last block's TX count as a proxy.
  if (blocks.length === 0) return 0;
  return blocks[blocks.length - 1]?.transactionCount ?? 0;
}

function avgBlockTimeS(series: BlockTimeDatum[]): number {
  if (series.length === 0) return 0;
  return series.reduce((s, d) => s + d.blockTimeS, 0) / series.length;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChainHealth() {
  const root = useRouteLoaderData('root') as { nodeUrl?: string } | undefined;
  const nodeUrl = root?.nodeUrl ?? 'https://testnet-node.decentralchain.io';

  const [snapshot, setSnapshot] = useState<ChainSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const { height } = await fetchHeight(nodeUrl);
      const from = Math.max(1, height - 99);
      const blocks = await fetchBlockHeadersSeqPaginated(nodeUrl, from, height);
      setSnapshot({ blocks, fetchedAt: performance.now(), height });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chain data');
    } finally {
      setLoading(false);
    }
  }, [nodeUrl]);

  useEffect(() => {
    void fetchSnapshot();
    const interval = setInterval(() => void fetchSnapshot(), 15_000);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const series = snapshot ? deriveBlockTimeSeries(snapshot.blocks) : [];
  const avg = avgBlockTimeS(series);
  const tps = snapshot ? computeTps(snapshot.blocks) : 0;
  const lastTxCount = computeMempoolDepth(snapshot?.blocks ?? []);

  // Fork detection: look for any block pair with time gap > 5× target (60s)
  const FORK_THRESHOLD_S = 300;
  const forkWarnings = series.filter((d) => d.blockTimeS > FORK_THRESHOLD_S);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chain Health</h1>
        <span className="text-xs text-muted-foreground">Auto-refresh 15s</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Height"
          value={loading ? null : (snapshot?.height.toLocaleString() ?? '—')}
        />
        <StatCard
          icon={<Gauge className="h-4 w-4" />}
          label="TPS (last 10 blocks)"
          value={loading ? null : tps.toFixed(2)}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Avg Block Time (100 blocks)"
          value={loading ? null : `${avg.toFixed(1)}s`}
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Last Block TXs"
          value={loading ? null : lastTxCount.toString()}
        />
      </div>

      {/* Fork warnings */}
      {forkWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-600/40 bg-yellow-600/10 p-4 text-sm text-yellow-600">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <strong>
              {forkWarnings.length} block gap{forkWarnings.length > 1 ? 's' : ''}
            </strong>{' '}
            &gt;{FORK_THRESHOLD_S}s detected at heights:{' '}
            {forkWarnings.map((d) => d.height).join(', ')} — possible fork or node restart.
          </span>
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Block time chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Block Time — last {series.length} blocks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : series.length < 2 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Not enough data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="height"
                  tickFormatter={(v: number) => String(v)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis unit="s" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip
                  labelFormatter={(label) => `Block #${label}`}
                  formatter={(value) => [`${value}s`, 'Block time']}
                />
                <ReferenceLine
                  y={60}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="4 4"
                  label={{ fontSize: 10, value: '60s target' }}
                />
                <Line
                  type="monotone"
                  dataKey="blockTimeS"
                  stroke="var(--color-chart-1)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        {value === null ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="text-xl font-bold font-mono">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
