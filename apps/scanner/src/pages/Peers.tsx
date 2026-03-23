import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Globe, Leaf, MapPin, Network, Pause, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  fetchConnectedPeers,
  fetchSuspendedPeers,
  type IAllConnectedResponse,
  type IAllResponse,
  type IBlackPeer,
  type ISuspendedPeer,
} from '@/lib/api';
import { type NodeRegistrationRecord, type Peer } from '@/types';
import { useLanguage } from '../components/contexts/LanguageContext';
import { fromUnix } from '../components/utils/formatters';

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
    // ISuspendedPeer[] / IBlackPeer[] have {hostname, timestamp} — normalize to Peer shape
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

export default function Peers() {
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

  // Fetch node registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const registrations = await NodeRegistration.list();
        setNodeRegistrations(registrations);
      } catch (error) {
        console.error('Failed to fetch node registrations:', error);
      }
    };
    void fetchRegistrations();
  }, []);

  // Collect all unique IPs across every peer list for geo enrichment
  const uniqueIps = useMemo(() => {
    const allPeers = [
      ...extractPeers(connected),
      ...extractPeers(all),
      ...extractPeers(suspended),
      ...extractPeers(blacklisted),
    ];
    const seen = new Set<string>();
    for (const peer of allPeers) {
      const ip = extractIp(peer.address || peer.declaredAddress);
      if (ip) seen.add(ip);
    }
    return [...seen];
  }, [connected, all, suspended, blacklisted]);

  // React Query handles caching, deduplication, retry, and AbortController
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
              Array.from({ length: 5 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
                (skeletonKey) => (
                  <TableRow key={skeletonKey}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ),
              )
            ) : peerList.length > 0 ? (
              peerList.map((peer) => {
                const address = peer.address || peer.declaredAddress;
                const ip = extractIp(address);
                const peerGeo = ip ? geoByIp[ip] : undefined;
                const geo = peerGeo?.geo;
                const green = peerGeo?.green;
                const nodeName = resolveNodeName(peer) || t('unknownNode');

                return (
                  <TableRow key={peer.address || peer.declaredAddress || nodeName}>
                    <TableCell className="font-mono text-sm">{peer.address || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {peer.declaredAddress || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">{nodeName}</div>
                    </TableCell>
                    <TableCell>
                      {geo ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{[geo.city, geo.country].filter(Boolean).join(', ')}</span>
                          {geo.countryCode && (
                            <span className="text-xl">
                              {String.fromCodePoint(
                                ...[...geo.countryCode.toUpperCase()].map(
                                  (c) => 127397 + c.charCodeAt(0),
                                ),
                              )}
                            </span>
                          )}
                        </div>
                      ) : peerGeo?.isLoading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {green ? (
                        green.green ? (
                          <Badge className="bg-success/10 text-success gap-1">
                            <Leaf className="w-3 h-3" />
                            Green
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            Standard
                          </Badge>
                        )
                      ) : peerGeo?.isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {peer.lastSeen ? fromUnix(peer.lastSeen) : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('noPeersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('networkPeers')}</h1>
        <p className="text-muted-foreground">{t('viewPeerConnections')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('connected')}</p>
                <p className="text-2xl font-bold">
                  {connectedLoading ? '...' : extractPeers(connected).length || 0}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('allPeers')}</p>
                <p className="text-2xl font-bold">
                  {allLoading ? '...' : extractPeers(all).length || 0}
                </p>
              </div>
              <div className="p-3 bg-info/10 rounded-xl">
                <Globe className="w-6 h-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('suspended')}</p>
                <p className="text-2xl font-bold">
                  {suspendedLoading ? '...' : extractPeers(suspended).length || 0}
                </p>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl">
                <Pause className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('blacklisted')}</p>
                <p className="text-2xl font-bold">
                  {blacklistedLoading ? '...' : extractPeers(blacklisted).length || 0}
                </p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-xl">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peer Lists */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            {t('peerDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="connected">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="connected">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('connected')}
                </TabsTrigger>
                <TabsTrigger value="all">
                  <Globe className="w-4 h-4 mr-2" />
                  {t('allPeers')}
                </TabsTrigger>
                <TabsTrigger value="suspended">
                  <Pause className="w-4 h-4 mr-2" />
                  {t('suspended')}
                </TabsTrigger>
                <TabsTrigger value="blacklisted">
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('blacklisted')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="connected" className="mt-6">
              <PeerTable peers={connected} isLoading={connectedLoading} />
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <PeerTable peers={all} isLoading={allLoading} />
            </TabsContent>

            <TabsContent value="suspended" className="mt-6">
              <PeerTable peers={suspended} isLoading={suspendedLoading} />
            </TabsContent>

            <TabsContent value="blacklisted" className="mt-6">
              <PeerTable peers={blacklisted} isLoading={blacklistedLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
