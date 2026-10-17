import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';
import { CAMPUS_CENTER } from '../config.js';

export default function BusTracking() {
  const { t } = useLang();
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/bus').then((d) => { setBuses(d.buses); setError(''); }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <>
      <PageHero icon="fa-bus" title={t('bus.title')} sub={t('bus.sub')} />
      <div className="container py-4">
        <div className="panel">
          {error && <div className="alert alert-danger">{error}</div>}
          <MapContainer center={CAMPUS_CENTER} zoom={14} className="map-box" scrollWheelZoom>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {buses.map((b) => (
              <CircleMarker key={b.busId} center={[b.latitude, b.longitude]} radius={9} pathOptions={{ color: '#fff', fillColor: '#c62828', fillOpacity: 1, weight: 2 }}>
                <Popup>{b.busId} · {b.route}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="row g-3 mt-2">
            {buses.map((b) => (
              <div className="col-md-6" key={b.busId}>
                <div className="stat-box">
                  <strong><i className="fa-solid fa-bus gold me-2" />{b.busId}</strong>
                  <div className="small text-muted">{t('bus.route')}: {b.route}</div>
                  <div className="small">{t('bus.eta')}: <b>{b.etaMinutes} {t('bus.min')}</b> · {b.latitude}, {b.longitude}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-warning mt-3 mb-0 d-flex align-items-center">
            <i className="fa-solid fa-triangle-exclamation me-2" />
            <span className="me-auto">{t('bus.demoNote')}</span>
            <button className="btn btn-sm btn-navy" onClick={load}><i className="fa-solid fa-rotate me-1" />{t('bus.refresh')}</button>
          </div>
        </div>
      </div>
    </>
  );
}
