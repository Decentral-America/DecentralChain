/**
 * Network — consolidated "Network" tab (DCC-108 nav restructure).
 *
 * Three sub-tabs:
 *   Overview — block-time analytics, TPS, utilisation charts (was NetworkStatistics)
 *   Peers    — connected / all / suspended / blacklisted tables + geo map (was Peers + NetworkMap)
 *   Node     — node status & version inspector (was Node)
 *
 * All previous routes (/NetworkStatistics, /NetworkMap, /Peers, /Node) are kept in
 * routes.ts as deep-link redirects so shared URLs continue to work.
 */
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Leaf,
  type LucideIcon,
  MapPin,
  Network as NetworkIcon,
  Pause,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { NodeRegistration } from '@/api/entities';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractIp, usePeerGeo } from '@/hooks/usePeerGeo';
import {
  fetchAllPeers,
  fetchBlacklistedPeers,
  fetchBlockHeadersSeq,
  fetchConnectedPeers,
  fetchHeight,
  fetchNodeStatus,
  fetchNodeVersion,
  fetchSuspendedPeers,
  type IAllConnectedResponse,
  type IAllResponse,
  type IBlackPeer,
  type IBlockHeader,
  type INodeStatus,
  type INodeVersion,
  type ISuspendedPeer,
} from '@/lib/api';
import { type NodeRegistrationRecord, type Peer } from '@/types';
import { useLanguage } from '../components/contexts/LanguageContext';
import { fromUnix } from '../components/utils/formatters';

// ─── Shared ─────────────────────────────────────────────────────────────────

type PeerApiShape =
  | Peer[]
  | IAllConnectedResponse
  | IAllResponse
  | ISuspendedPeer[]
  | IBlackPeer[]
  | null
  | undefined;

const extractPeers = (data: PeerApiShape): Peer[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length > 0 && data[0] && 'hostname' in data[0] && !('address' in data[0])) {
      return (data as ISuspendedPeer[]).map((p) => ({
        address: (p as ISuspendedPeer & { hostname: string }).hostname,
        lastSeen: p.timestamp,
        ...('reason' in p ? { peerName: (p as IBlackPeer).reason } : {}),
      })) as Peer[];
    }
    return data as Peer[];
  }
  return ((data as IAllConnectedResponse | IAllResponse).peers as Peer[]) || [];
};

// ─── Overview sub-tab (NetworkStatistics) ───────────────────────────────────

function OverviewTab() {
  const { t } = useLanguage();

  const { data: height } = useQuery<{ height: number }>({
    queryFn: () => fetchHeight(),
    queryKey: ['height'],
  });

  const { data: nodeStatus } = useQuery<INodeStatus>({
    queryFn: () => fetchNodeStatus(),
    queryKey: ['nodeStatus'],
  });

  const { data: nodeVersion } = useQuery<INodeVersion>({
    queryFn: () => fetchNodeVersion(),
    queryKey: ['nodeVersion'],
  });

  const { data: connectedPeers } = useQuery<IAllConnectedResponse>({
    queryFn: () => fetchConnectedPeers(),
    queryKey: ['peers', 'connected'],
  });

  const currentHeight = height?.height || 0;

  const { data: recentBlocks, isLoading: blocksLoading } = useQuery<IBlockHeader[]>({
    enabled: currentHeight > 0,
    queryFn: () => fetchBlockHeadersSeq(Math.max(1, currentHeight - 99), currentHeight),
    queryKey: ['recentBlocks', currentHeight],
  });

  const analytics = useMemo(() => {
    if (!recentBlocks || recentBlocks.length < 2) return null;

    const sorted = [...recentBlocks].sort((a, b) => a.height - b.height);

    const blockTimes: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const c = sorted[i];
      const p = sorted[i - 1];
      if (!c || !p) continue;
      const d = (c.timestamp - p.timestamp) / 1000;
      if (d > 0) blockTimes.push(d);
    }
    const avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length;
    const totalTxs = sorted.reduce((s, b) => s + (b.transactionCount || 0), 0);
    const firstBlock = sorted[0];
    const lastBlock = sorted[sorted.length - 1];
    if (!firstBlock || !lastBlock) return null;
    const totalTime = (lastBlock.timestamp - firstBlock.timestamp) / 1000;
    const tps = totalTime > 0 ? totalTxs / totalTime : 0;
    const chartData = sorted.slice(-50).map((b) => ({
      height: b.height,
      txCount: b.transactionCount || 0,
    }));
    const blockTimeData: Array<{ height: number; time: number }> = [];
    for (let i = 1; i < Math.min(sorted.length, 50); i++) {
      const c = sorted[sorted.length - 50 + i];
      const p = sorted[sorted.length - 50 + i - 1];
      if (!c || !p) continue;
      blockTimeData.push({ height: c.height, time: (c.timestamp - p.timestamp) / 1000 });
    }
    const avgBlockSize = sorted.reduce((s, b) => s + (b.blocksize || 0), 0) / sorted.length;
    const blockSizeData = sorted.slice(-50).map((b) => ({
      height: b.height,
      size: b.blocksize || 0,
    }));

    return {
      avgBlockSize: avgBlockSize.toFixed(0),
      avgBlockTime: avgBlockTime.toFixed(2),
      avgTxPerBlock: (totalTxs / sorted.length).toFixed(2),
      blockSizeData,
      blockTimeData,
      chartData,
      totalTxs,
      tps: tps.toFixed(3),
    };
  }, [recentBlocks]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    loading,
  }: {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
    loading?: boolean;
  }) => (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
          </div>
          <div className={`p-3 ${color} rounded-xl`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-').replace('/10', '')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          color="bg-blue-500/10"
          icon={Activity}
          loading={blocksLoading}
          title={t('currentHeight')}
          value={currentHeight.toLocaleString()}
        />
        <StatCard
          color="bg-green-500/10"
          icon={Clock}
          loading={blocksLoading}
          title={t('avgBlockTime')}
          value={analytics ? `${analytics.avgBlockTime}s` : '—'}
        />
        <StatCard
          color="bg-purple-500/10"
          icon={Zap}
          loading={blocksLoading}
          title="TPS"
          value={analytics?.tps ?? '—'}
        />
        <StatCard
          color="bg-orange-500/10"
          icon={BarChart3}
          loading={blocksLoading}
          title={t('avgTxPerBlock')}
          value={analytics?.avgTxPerBlock ?? '—'}
        />
        <StatCard
          color="bg-teal-500/10"
          icon={NetworkIcon}
          loading={false}
          title={t('connectedPeers')}
          value={String(extractPeers(connectedPeers).length || '—')}
        />
        <StatCard
          color="bg-red-500/10"
          icon={Server}
          loading={false}
          title={t('nodeVersion')}
          value={nodeVersion?.version ?? '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('transactionsPerBlock')} (last 50)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blocksLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer height={240} width="100%">
                <BarChart data={analytics?.chartData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="height" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="txCount" fill="#3b82f6" name="Transactions" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('blockTime')} (last 50)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blocksLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer height={240} width="100%">
                <LineChart data={analytics?.blockTimeData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="height" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="s" />
                  <Tooltip formatter={(v) => [`${v}s`, 'Block time']} />
                  <Line
                    dataKey="time"
                    dot={false}
                    name="Block Time"
                    stroke="#10b981"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {t('blockSize')} (last 50)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blocksLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer height={240} width="100%">
                <BarChart data={analytics?.blockSizeData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="height" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="B" />
                  <Tooltip formatter={(v) => [`${v} B`, 'Block size']} />
                  <Bar dataKey="size" fill="#8b5cf6" name="Size" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Node Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Status', value: nodeStatus?.blockGeneratorStatus ?? 'generating' },
              {
                label: 'State hash',
                value: nodeStatus?.stateHash ? `${nodeStatus.stateHash.slice(0, 24)}…` : '—',
              },
              { label: 'Peers', value: String(nodeStatus?.peersCount ?? '—') },
            ].map(({ label, value }) => (
              <div className="flex items-center justify-between" key={label}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Peers sub-tab ───────────────────────────────────────────────────────────

function PeersTab() {
  const { t } = useLanguage();
  const [nodeRegistrations, setNodeRegistrations] = useState<NodeRegistrationRecord[]>([]);

  const { data: connected, isLoading: connectedLoading } = useQuery<IAllConnectedResponse>({
    queryFn: () => fetchConnectedPeers(),
    queryKey: ['peers', 'connected'],
  });
  const { data: all, isLoading: allLoading } = useQuery<IAllResponse>({
    queryFn: () => fetchAllPeers(),
    queryKey: ['peers', 'all'],
  });
  const { data: suspended, isLoading: suspendedLoading } = useQuery<ISuspendedPeer[]>({
    queryFn: () => fetchSuspendedPeers(),
    queryKey: ['peers', 'suspended'],
  });
  const { data: blacklisted, isLoading: blacklistedLoading } = useQuery<IBlackPeer[]>({
    queryFn: () => fetchBlacklistedPeers(),
    queryKey: ['peers', 'blacklisted'],
  });

  useEffect(() => {
    NodeRegistration.list()
      .then(setNodeRegistrations)
      .catch((err: unknown) => console.error('Failed to fetch node registrations:', err));
  }, []);

  const uniqueIps = useMemo(() => {
    const allPeersList = [
      ...extractPeers(connected),
      ...extractPeers(all),
      ...extractPeers(suspended),
      ...extractPeers(blacklisted),
    ];
    const seen = new Set<string>();
    for (const peer of allPeersList) {
      const ip = extractIp(peer.address || peer.declaredAddress);
      if (ip) seen.add(ip);
    }
    return [...seen];
  }, [connected, all, suspended, blacklisted]);

  const geoByIp = usePeerGeo(uniqueIps);

  const resolveNodeName = (peer: Peer): string | null => {
    const peerNodeName = typeof peer.nodeName === 'string' ? peer.nodeName : null;
    const registration = nodeRegistrations.find(
      (reg) =>
        reg.status === 'approved' &&
        peerNodeName &&
        typeof reg.node_name === 'string' &&
        peerNodeName.toLowerCase().includes(reg.node_name.toLowerCase()),
    );
    return (
      (typeof registration?.node_name === 'string' ? registration.node_name : null) || peerNodeName
    );
  };

  const PeerTable = ({ peers, isLoading }: { peers: PeerApiShape; isLoading: boolean }) => {
    const peerList = extractPeers(peers);
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('address')}</TableHead>
              <TableHead>{t('declaredAddress')}</TableHead>
              <TableHead>{t('nodeName')}</TableHead>
              <TableHead>{t('country')}</TableHead>
              <TableHead>Green Host</TableHead>
              <TableHead>{t('lastSeen')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => `sk-${i}`).map((k) => (
                <TableRow key={k}>
                  {Array.from({ length: 6 }, (_, j) => `sk-cell-${j}`).map((ck) => (
                    <TableCell key={ck}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : peerList.length === 0 ? (
              <TableRow>
                <TableCell className="text-center text-muted-foreground py-8" colSpan={6}>
                  No peers found
                </TableCell>
              </TableRow>
            ) : (
              peerList.map((peer, idx) => {
                const ip = extractIp(peer.address || peer.declaredAddress);
                const geo = ip ? geoByIp[ip] : null;
                const nodeName = resolveNodeName(peer);
                const greenHosting = geo?.hosting?.green;
                return (
                  <TableRow key={peer.address || idx}>
                    <TableCell className="font-mono text-xs">{peer.address ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {peer.declaredAddress ?? '—'}
                    </TableCell>
                    <TableCell>
                      {nodeName ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{nodeName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {geo ? (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {geo.city ? `${geo.city}, ` : ''}
                            {geo.country}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {greenHosting === undefined ? (
                        <Pause className="w-4 h-4 text-muted-foreground" />
                      ) : greenHosting ? (
                        <div className="flex items-center gap-1">
                          <Leaf className="w-4 h-4 text-green-500" />
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </div>
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {peer.lastSeen ? fromUnix(Math.floor(peer.lastSeen / 1000)) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="connected">
        <TabsList>
          <TabsTrigger value="connected">
            {t('connected')}
            {connected && (
              <Badge className="ml-2" variant="secondary">
                {extractPeers(connected).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            {t('allPeers')}
            {all && (
              <Badge className="ml-2" variant="secondary">
                {extractPeers(all).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suspended">
            {t('suspended')}
            {suspended && (
              <Badge className="ml-2" variant="secondary">
                {extractPeers(suspended).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blacklisted">
            {t('blacklisted')}
            {blacklisted && (
              <Badge className="ml-2" variant="secondary">
                {(blacklisted as IBlackPeer[]).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected">
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <PeerTable isLoading={connectedLoading} peers={connected} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <PeerTable isLoading={allLoading} peers={all} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="suspended">
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <PeerTable isLoading={suspendedLoading} peers={suspended} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="blacklisted">
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <PeerTable isLoading={blacklistedLoading} peers={blacklisted} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Node sub-tab ────────────────────────────────────────────────────────────

function NodeTab() {
  const { t } = useLanguage();

  const { data: status, isLoading: statusLoading } = useQuery<INodeStatus>({
    queryFn: () => fetchNodeStatus(),
    queryKey: ['nodeStatus'],
  });
  const { data: version, isLoading: versionLoading } = useQuery<INodeVersion>({
    queryFn: () => fetchNodeVersion(),
    queryKey: ['nodeVersion'],
  });

  const InfoCard = ({
    title,
    value,
    icon: Icon,
    badge,
  }: {
    title: string;
    value: string;
    icon: LucideIcon;
    badge?: string;
  }) => (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            {statusLoading || versionLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {badge && <Badge className="mt-2">{badge}</Badge>}
          </div>
          <div className="p-3 bg-info/10 rounded-xl">
            <Icon className="w-6 h-6 text-info" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Server} title={t('nodeVersion')} value={version?.version ?? '—'} />
        <InfoCard
          badge={status?.blockGeneratorStatus}
          icon={Activity}
          title="Generator Status"
          value={status?.blockGeneratorStatus ?? '—'}
        />
        <InfoCard
          icon={NetworkIcon}
          title="Connected Peers"
          value={String(status?.peersCount ?? '—')}
        />
        <InfoCard
          icon={Database}
          title="State Hash"
          value={status?.stateHash ? `${status.stateHash.slice(0, 12)}…` : '—'}
        />
      </div>

      {status && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Raw Node Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap break-all">
              {JSON.stringify(status, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page shell ─────────────────────────────────────────────────────────────

export default function Network() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Network</h1>
        <p className="text-muted-foreground">
          Analytics, peer status, and node health for the DecentralChain network.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="peers">
            <NetworkIcon className="w-4 h-4 mr-2" />
            Peers
          </TabsTrigger>
          <TabsTrigger value="node">
            <Server className="w-4 h-4 mr-2" />
            Node
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="peers">
          <PeersTab />
        </TabsContent>
        <TabsContent value="node">
          <NodeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
