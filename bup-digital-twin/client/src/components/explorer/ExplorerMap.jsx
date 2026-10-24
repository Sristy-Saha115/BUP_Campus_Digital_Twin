import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { CAMPUS_CENTER } from '../../config.js';

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 18, { duration: 0.8 }); }, [coords, map]);
  return null;
}

// Same 2D (OpenStreetMap) base map as the Campus Map page. Only facilities with a VERIFIED position
// get a marker; the campus-centre point is deliberately not drawn here because it is only approximate.
export default function ExplorerMap({ facilities, selectedSlug, onSelect }) {
  const pins = facilities.filter((f) => f.mapStatus === 'verified' && f.location.coords);
  const selected = pins.find((f) => f.slug === selectedSlug);
  return (
    <MapContainer center={CAMPUS_CENTER} zoom={16} className="map-box" scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FlyTo coords={selected ? selected.location.coords : null} />
      {pins.map((f) => {
        const on = f.slug === selectedSlug;
        return (
          <CircleMarker
            key={f.slug}
            center={f.location.coords}
            radius={on ? 12 : 8}
            pathOptions={{ color: '#0b2a4a', weight: on ? 3 : 2, fillColor: on ? '#f2b705' : '#1d6fb8', fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(f.slug) }}
          >
            <Popup><strong>{f.name}</strong>{f.location.text && <div>{f.location.text}</div>}</Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
