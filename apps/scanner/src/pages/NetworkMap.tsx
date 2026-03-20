import { useQuery } from '@tanstack/react-query';
import { Globe, MapPin } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { extractIp, usePeerGeo } from '@/hooks/usePeerGeo';
import { fetchAllPeers, fetchConnectedPeers } from '@/lib/api';
import { useLanguage } from '../components/contexts/LanguageContext';
import { type GeolocatedPeer } from './NetworkMapContent';

/**
 * Leaflet accesses `window` at module load time and crashes in SSR/Node.js.
 * Guard the dynamic import so it's only evaluated on the client.
 */
const NetworkMapContent = lazy(() =>
  typeof window !== 'undefined'
    ? import('./NetworkMapContent')
    : Promise.resolve({ default: () => null as unknown as React.ReactElement }),
);

export default function NetworkMap() {
  const { t } = useLanguage();

  const { data: connectedPeers, isLoading } = useQuery({
    queryFn: () => fetchConnectedPeers(),
    queryKey: ['peers', 'connected'],
  });

  const { data: allPeers } = useQuery({
    queryFn: () => fetchAllPeers(),
    queryKey: ['peers', 'all'],
  });

  // Extract unique IPs from connected peers for geo enrichment.
  const peerIps = useMemo(
    () =>
      Array.from(
        new Set(
          (connectedPeers?.peers ?? [])
            .map((p) => extractIp(p.address))
            .filter((ip): ip is string => ip !== undefined),
        ),
      ),
    [connectedPeers],
  );

  const geoData = usePeerGeo(peerIps);

  const geolocatedPeers = useMemo((): GeolocatedPeer[] => {
    if (!connectedPeers?.peers) return [];

    return connectedPeers.peers.flatMap((peer) => {
      const ip = extractIp(peer.address);
      const geo = ip ? geoData[ip]?.geo : undefined;
      if (!geo?.loc) return [];
      const [latStr, lngStr] = geo.loc.split(',');
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return [];
      return [
        {
          address: peer.address,
          city: geo.city ?? ip ?? '',
          lat,
          lng,
        },
      ];
    });
  }, [connectedPeers, geoData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('networkMapTitle')}</h1>
        <p className="text-muted-foreground">{t('geographicalDistribution')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('connectedPeers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? '...' : connectedPeers?.peers?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('allKnownPeers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{allPeers?.peers?.length || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('geolocatedPeers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{geolocatedPeers.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>{t('peerDistribution')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <div className="h-[600px] w-full">
              <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                <NetworkMapContent
                  geolocatedPeers={geolocatedPeers}
                  unknownNodeLabel={t('unknownNode')}
                  addressLabel={t('addressColon')}
                  locationLabel={t('locationColon')}
                />
              </Suspense>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peer List */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>{t('connectedPeersList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 5 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
                (skeletonKey) => <Skeleton key={skeletonKey} className="h-16 w-full" />,
              )
            ) : geolocatedPeers.length > 0 ? (
              geolocatedPeers.map((peer) => (
                <div
                  key={`${peer.address || peer.peerName}-${peer.lat}-${peer.lng}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted"
                >
                  <div>
                    <p className="font-medium text-sm">{peer.peerName || t('unknownNode')}</p>
                    <p className="text-xs text-muted-foreground font-mono">{peer.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{peer.city}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">{t('noPeersFound')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
