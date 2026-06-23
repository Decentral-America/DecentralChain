import { Activity, CheckCircle, Cpu, PauseCircle, Users, XCircle, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useLoaderData, useRevalidator, useRouteLoaderData } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type BalanceDetails,
  type BlockHeader,
  type ConnectedPeer,
  fetchAllPeers,
  fetchBalanceDetails,
  fetchBlacklistedPeers,
  fetchBlockHeadersSeqPaginated,
  fetchConnectedPeers,
  fetchHeight,
  fetchRewards,
  fetchSuspendedPeers,
} from '@/lib/api';
import { type Route } from './+types/Nodes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratorStat {
  address: string;
  blocksProduced: number;
  rewardTotal: number;
  feeTotal: number;
  generatingBalance: number;
  sharePercent: number;
}

interface AllPeer {
  address: string;
  lastSeen?: number;
}

interface SuspendedPeer {
  hostname: string;
  timestamp: number;
}

interface BlacklistedPeer {
  hostname: string;
  timestamp: number;
  reason?: string;
}

interface LoaderData {
  currentHeight: number;
  sampleSize: number;
  avgBlockTimeMs: number;
  connectedPeers: ConnectedPeer[];
  allPeers: AllPeer[];
  suspendedPeers: SuspendedPeer[];
  blacklistedPeers: BlacklistedPeer[];
  currentReward: number;
  generators: GeneratorStat[];
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader(_: Route.LoaderArgs): Promise<LoaderData> {
  const nodeUrl = process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io';

  const { height } = await fetchHeight(nodeUrl);
  const sampleSize = Math.min(500, height);
  const from = Math.max(1, height - sampleSize + 1);

  const [headersRes, connectedRes, allRes, suspendedRes, blacklistedRes, rewardsRes] =
    await Promise.allSettled([
      fetchBlockHeadersSeqPaginated(nodeUrl, from, height),
      fetchConnectedPeers(nodeUrl),
      fetchAllPeers(nodeUrl),
      fetchSuspendedPeers(nodeUrl),
      fetchBlacklistedPeers(nodeUrl),
      fetchRewards(nodeUrl),
    ]);

  const blocks: BlockHeader[] = headersRes.status === 'fulfilled' ? headersRes.value : [];
  const connectedPeers = connectedRes.status === 'fulfilled' ? connectedRes.value.peers : [];
  const allPeers = allRes.status === 'fulfilled' ? (allRes.value.peers as AllPeer[]) : [];
  const suspendedPeers =
    suspendedRes.status === 'fulfilled' ? (suspendedRes.value as SuspendedPeer[]) : [];
  const blacklistedPeers =
    blacklistedRes.status === 'fulfilled' ? (blacklistedRes.value as BlacklistedPeer[]) : [];
  const currentReward =
    rewardsRes.status === 'fulfilled' ? rewardsRes.value.currentReward : 600_000_000;

  let avgBlockTimeMs = 60_000;
  if (blocks.length >= 2) {
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    if (first && last && last.timestamp > first.timestamp) {
      avgBlockTimeMs = (last.timestamp - first.timestamp) / (blocks.length - 1);
    }
  }

  // Aggregate per-generator stats from block history
  const byAddress = new Map<string, BlockHeader[]>();
  for (const block of blocks) {
    const existing = byAddress.get(block.generator);
    if (existing) existing.push(block);
    else byAddress.set(block.generator, [block]);
  }

  const addresses = [...byAddress.keys()];
  const balanceResults = await Promise.allSettled(
    addresses.map((addr) => fetchBalanceDetails(nodeUrl, addr)),
  );
  const balanceMap = new Map<string, BalanceDetails>();
  for (let i = 0; i < addresses.length; i++) {
    const result = balanceResults[i];
    const addr = addresses[i];
    if (result?.status === 'fulfilled' && addr) balanceMap.set(addr, result.value);
  }

  const generators: GeneratorStat[] = addresses
    .map((address): GeneratorStat => {
      const addrBlocks = byAddress.get(address) ?? [];
      const blocksProduced = addrBlocks.length;
      const rewardTotal = addrBlocks.reduce((s, b) => s + (b.reward ?? 0), 0);
      const feeTotal = addrBlocks.reduce((s, b) => s + (b.totalFee ?? 0), 0);
      const generatingBalance = balanceMap.get(address)?.generating ?? 0;
      const sharePercent = blocks.length > 0 ? (blocksProduced / blocks.length) * 100 : 0;
      return { address, blocksProduced, feeTotal, generatingBalance, rewardTotal, sharePercent };
    })
    .sort((a, b) => b.blocksProduced - a.blocksProduced);

  return {
    allPeers,
    avgBlockTimeMs,
    blacklistedPeers,
    connectedPeers,
    currentHeight: height,
    currentReward,
    generators,
    sampleSize: blocks.length,
    suspendedPeers,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(wavelet: number): string {
  return (wavelet / 1e8).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function truncate(addr: string, n = 8): string {
  if (addr.length <= n * 2) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-6)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Nodes() {
  const data = useLoaderData<typeof loader>();
  const { revalidate, state } = useRevalidator();
  const root = useRouteLoaderData('root') as { scannerUrl?: string } | undefined;
  const scannerBase = root?.scannerUrl ?? 'https://testnet-scanner.decentralchain.io';

  useEffect(() => {
    const interval = setInterval(() => revalidate(), 30_000);
    return () => clearInterval(interval);
  }, [revalidate]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Network Nodes</h1>
        <span className="text-xs text-muted-foreground">
          {state === 'loading' ? 'Refreshing…' : 'Auto-refresh 30s'}
        </span>
      </div>

      {/* Chain stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label="Height"
          value={data.currentHeight.toLocaleString()}
        />
        <StatCard
          icon={<Cpu className="w-4 h-4" />}
          label="Active Generators"
          value={data.generators.length.toString()}
        />
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Avg Block Time"
          value={`${(data.avgBlockTimeMs / 1000).toFixed(1)}s`}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Connected Peers"
          value={data.connectedPeers.length.toString()}
        />
      </div>

      {/* Peers tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Peers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="connected">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="connected">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected ({data.connectedPeers.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  <Users className="w-3 h-3 mr-1" />
                  All ({data.allPeers.length})
                </TabsTrigger>
                <TabsTrigger value="suspended">
                  <PauseCircle className="w-3 h-3 mr-1" />
                  Suspended ({data.suspendedPeers.length})
                </TabsTrigger>
                <TabsTrigger value="blacklisted">
                  <XCircle className="w-3 h-3 mr-1" />
                  Blacklisted ({data.blacklistedPeers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="connected" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Declared Address</TableHead>
                      <TableHead>Peer Name</TableHead>
                      <TableHead>Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.connectedPeers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No connected peers.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.connectedPeers.map((peer) => (
                        <TableRow key={peer.address}>
                          <TableCell className="font-mono text-sm">{peer.address}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {peer.declaredAddress || '—'}
                          </TableCell>
                          <TableCell className="text-sm">{peer.peerName || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {peer.applicationVersion || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.allPeers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                          No peers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.allPeers.map((peer) => (
                        <TableRow key={peer.address}>
                          <TableCell className="font-mono text-sm">{peer.address}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {peer.lastSeen ? new Date(peer.lastSeen).toUTCString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="suspended" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Suspended At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.suspendedPeers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                          No suspended peers.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.suspendedPeers.map((peer) => (
                        <TableRow key={peer.hostname}>
                          <TableCell className="font-mono text-sm">{peer.hostname}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(peer.timestamp).toUTCString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="blacklisted" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blacklisted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.blacklistedPeers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          No blacklisted peers.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.blacklistedPeers.map((peer) => (
                        <TableRow key={peer.hostname}>
                          <TableCell className="font-mono text-sm">{peer.hostname}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {peer.reason ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(peer.timestamp).toUTCString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generator leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Block Production — last {data.sampleSize} blocks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-6">#</TableHead>
                  <TableHead>Generator</TableHead>
                  <TableHead className="text-right">Blocks</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Rewards</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Generating Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.generators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No block data yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.generators.map((g, i) => (
                    <TableRow key={g.address}>
                      <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                      <TableCell>
                        <a
                          href={`${scannerBase}/generator?addr=${g.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {truncate(g.address)}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {g.blocksProduced}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={g.sharePercent > 20 ? 'default' : 'secondary'}>
                          {g.sharePercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {g.rewardTotal > 0 ? `${fmt(g.rewardTotal)} DCC` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {g.feeTotal > 0 ? `${fmt(g.feeTotal)} DCC` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(g.generatingBalance)} DCC
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {data.generators.length === 1 && (
            <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border">
              Only 1 active generator — other nodes need a positive generating balance to forge
              blocks.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-bold font-mono">{value}</p>
      </CardContent>
    </Card>
  );
}
