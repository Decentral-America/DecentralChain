/**
 * Client-only Leaflet map content for NetworkMap.
 *
 * This module is lazy-imported by NetworkMap.tsx with a client-side guard
 * to prevent leaflet (which accesses `window` at module load time) from
 * being evaluated during SSR.
 */
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface GeolocatedPeer {
  address?: string;
  peerName?: string;
  city: string;
  lat: number;
  lng: number;
}

interface NetworkMapContentProps {
  geolocatedPeers: GeolocatedPeer[];
  unknownNodeLabel: string;
  addressLabel: string;
  locationLabel: string;
  simulatedLabel: string;
}

export default function NetworkMapContent({
  geolocatedPeers,
  unknownNodeLabel,
  addressLabel,
  locationLabel,
  simulatedLabel,
}: NetworkMapContentProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geolocatedPeers.map((peer) => (
        <CircleMarker
          key={`${peer.address ?? peer.peerName}-${peer.lat}-${peer.lng}`}
          center={[peer.lat, peer.lng]}
          radius={8}
          fillColor="#3b82f6"
          fillOpacity={0.6}
          stroke={true}
          color="#1e40af"
          weight={2}
        >
          <Popup>
            <div className="p-2">
              <p className="font-semibold text-sm mb-1">{peer.peerName ?? unknownNodeLabel}</p>
              <p className="text-xs text-muted-foreground mb-1">
                <strong>{addressLabel}</strong> {peer.address}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>{locationLabel}</strong> {peer.city} {simulatedLabel}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
