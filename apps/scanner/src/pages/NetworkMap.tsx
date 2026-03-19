import { useQuery } from '@tanstack/react-query';
import { Globe, Info, MapPin } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

// Mock geolocation data for demonstration
// In production, this would come from a geolocation API
const MOCK_GEO_DATA = {
  asia: { city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  aus: { city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  // Some example coordinates for major cities
  default: { city: 'New York', lat: 40.7128, lng: -74.006 },
  eu: { city: 'London', lat: 51.5074, lng: -0.1278 },
};

function getRegionFromIP(ip: string): 'eu' | 'asia' | 'aus' | 'default' {
  // Very simplistic region detection for demo purposes
  if (ip.startsWith('88.') || ip.startsWith('185.')) return 'eu';
  if (ip.startsWith('61.') || ip.startsWith('202.')) return 'asia';
  if (ip.startsWith('203.')) return 'aus';
  return 'default';
}

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

  const geolocatedPeers = useMemo((): GeolocatedPeer[] => {
    if (!connectedPeers?.peers) return [];

    return connectedPeers.peers.map((peer) => {
      const ip = peer.address?.split(':')[0] || '';
      const region = getRegionFromIP(ip);
      const location = MOCK_GEO_DATA[region];

      // Deterministic offset based on IP to prevent exact overlaps
      let hash = 0;
      for (const char of ip) {
        hash = (hash * 31 + char.charCodeAt(0)) | 0;
      }
      const latOffset = ((hash & 0xffff) / 0xffff - 0.5) * 2;
      const lngOffset = (((hash >>> 16) & 0xffff) / 0xffff - 0.5) * 2;

      return {
        ...peer,
        city: location.city,
        lat: location.lat + latOffset,
        lng: location.lng + lngOffset,
      };
    });
  }, [connectedPeers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('networkMapTitle')}</h1>
        <p className="text-muted-foreground">{t('geographicalDistribution')}</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('demoMode')}</AlertTitle>
        <AlertDescription>{t('simulatedData')}</AlertDescription>
      </Alert>

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
              {t('regionsSimulated')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(MOCK_GEO_DATA).length}</p>
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
                  simulatedLabel={t('simulated')}
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
                    <p className="text-xs text-muted-foreground">{t('simulated')}</p>
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
