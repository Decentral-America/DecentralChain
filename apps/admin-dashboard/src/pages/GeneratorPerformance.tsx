import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type BalanceDetails,
  type BlockHeader,
  fetchBalanceDetails,
  fetchBlockHeadersSeqPaginated,
  fetchHeight,
} from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratorStats {
  address: string;
  blocksProduced: number;
  blocksExpected: number;
  uptimePct: number;
  skipRate: number;
  rewardTotal: number;
  feeTotal: number;
  generatingBalance: number;
}

interface EarningsDatum {
  height: number;
  reward: number;
  generator: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(wavelets: number): string {
  return (wavelets / 1e8).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function truncate(addr: string, n = 8): string {
  if (addr.length <= n * 2) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-6)}`;
}

function computeGeneratorStats(
  blocks: BlockHeader[],
  balanceMap: Map<string, BalanceDetails>,
): GeneratorStats[] {
  if (blocks.length === 0) return [];

  const byAddress = new Map<string, BlockHeader[]>();
  for (const block of blocks) {
    const existing = byAddress.get(block.generator);
    if (existing) existing.push(block);
    else byAddress.set(block.generator, [block]);
  }

  const totalBlocks = blocks.length;
  const addresses = [...byAddress.keys()];
  const totalGeneratingBalance = addresses.reduce(
    (sum, addr) => sum + (balanceMap.get(addr)?.generating ?? 0),
    0,
  );

  return addresses
    .map((address): GeneratorStats => {
      const addrBlocks = byAddress.get(address) ?? [];
      const blocksProduced = addrBlocks.length;
      const genBalance = balanceMap.get(address)?.generating ?? 0;

      // Expected blocks ∝ generating balance share × total blocks sampled
      const share = totalGeneratingBalance > 0 ? genBalance / totalGeneratingBalance : 0;
      const blocksExpected = Math.round(share * totalBlocks);

      const uptimePct =
        blocksExpected > 0 ? Math.min(100, (blocksProduced / blocksExpected) * 100) : 0;
      const skipRate =
        blocksExpected > 0 ? Math.max(0, (1 - blocksProduced / blocksExpected) * 100) : 0;

      const rewardTotal = addrBlocks.reduce((s, b) => s + (b.reward ?? 0), 0);
      const feeTotal = addrBlocks.reduce((s, b) => s + (b.totalFee ?? 0), 0);

      return {
        address,
        blocksExpected,
        blocksProduced,
        feeTotal,
        generatingBalance: genBalance,
        rewardTotal,
        skipRate,
        uptimePct,
      };
    })
    .sort((a, b) => b.blocksProduced - a.blocksProduced);
}

// ── Component ─────────────────────────────────────────────────────────────────

const SAMPLE_BLOCKS = 500;

export default function GeneratorPerformance() {
  const root = useRouteLoaderData('root') as { nodeUrl?: string } | undefined;
  const nodeUrl = root?.nodeUrl ?? 'https://testnet-node.decentralchain.io';

  const [generators, setGenerators] = useState<GeneratorStats[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<EarningsDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenerator, setSelectedGenerator] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { height } = await fetchHeight(nodeUrl);
      const from = Math.max(1, height - SAMPLE_BLOCKS + 1);
      const blocks = await fetchBlockHeadersSeqPaginated(nodeUrl, from, height);

      const addresses = [...new Set(blocks.map((b) => b.generator))];
      const balanceResults = await Promise.allSettled(
        addresses.map((addr) => fetchBalanceDetails(nodeUrl, addr)),
      );
      const balanceMap = new Map<string, BalanceDetails>();
      for (let i = 0; i < addresses.length; i++) {
        const result = balanceResults[i];
        const addr = addresses[i];
        if (result?.status === 'fulfilled' && addr) balanceMap.set(addr, result.value);
      }

      const stats = computeGeneratorStats(blocks, balanceMap);
      setGenerators(stats);

      // Build earnings history for the top generator (or selected one)
      const topAddress = stats[0]?.address ?? null;
      const focusAddress = selectedGenerator ?? topAddress;
      if (focusAddress) {
        const focusBlocks = blocks.filter((b) => b.generator === focusAddress);
        setEarningsHistory(
          focusBlocks.map((b) => ({
            generator: b.generator,
            height: b.height,
            reward: b.reward ?? 0,
          })),
        );
        if (!selectedGenerator && topAddress) setSelectedGenerator(topAddress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load generator data');
    } finally {
      setLoading(false);
    }
  }, [nodeUrl, selectedGenerator]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const scannerBase = 'https://testnet.decentralscan.com';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Generator Performance</h1>
        <span className="text-xs text-muted-foreground">
          Last {SAMPLE_BLOCKS} blocks · auto-refresh 60s
        </span>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Uptime &amp; Skip Rate</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Generator</TableHead>
                  <TableHead className="text-right">Produced</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Uptime</TableHead>
                  <TableHead className="text-right">Skip Rate</TableHead>
                  <TableHead className="text-right">Gen. Balance</TableHead>
                  <TableHead className="text-right">Rewards</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : generators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No block data yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  generators.map((g, i) => (
                    <TableRow
                      key={g.address}
                      className="cursor-pointer hover:bg-accent/30"
                      onClick={() => setSelectedGenerator(g.address)}
                    >
                      <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                      <TableCell>
                        <a
                          href={`${scannerBase}/generator?addr=${g.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncate(g.address)}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">
                        {g.blocksProduced}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {g.blocksExpected}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            g.uptimePct >= 90
                              ? 'default'
                              : g.uptimePct >= 70
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="font-mono text-xs"
                        >
                          <span className="mr-1">
                            {g.uptimePct >= 90 ? (
                              <TrendingUp className="h-3 w-3 inline" />
                            ) : (
                              <TrendingDown className="h-3 w-3 inline" />
                            )}
                          </span>
                          {g.uptimePct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {g.skipRate > 0 ? (
                          <span className="text-destructive">{g.skipRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground">0%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(g.generatingBalance)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(g.rewardTotal)} DCC
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Earnings trend for selected generator */}
      {earningsHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Block Rewards — {selectedGenerator ? truncate(selectedGenerator) : ''}
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                (click a row above to change generator)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={earningsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="height"
                  tickFormatter={(v: number) => String(v)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 1e8).toFixed(0)}`}
                  tick={{ fontSize: 11 }}
                  unit=" DCC"
                />
                <Tooltip
                  labelFormatter={(label) => `Block #${label}`}
                  formatter={(value) => [`${fmt(Number(value))} DCC`, 'Reward']}
                />
                <Line
                  type="monotone"
                  dataKey="reward"
                  stroke="var(--color-chart-2)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
