import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { CAMPUS_CENTER, UNIRANK_MAP_URL } from '../config.js';

export default function CampusMap() {
  const { t } = useLang();
  const [tab, setTab] = useState('interactive');
  return (
    <>
      <PageHero icon="fa-map-location-dot" title={t('map.title')} sub={t('map.sub')} />
      <div className="container py-4">
        <div className="panel">
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <button className={`btn ${tab === 'interactive' ? 'btn-navy' : 'btn-outline-navy'}`} onClick={() => setTab('interactive')}>
              {t('map.tabInteractive')}
            </button>
            <button className={`btn ${tab === 'official' ? 'btn-navy' : 'btn-outline-navy'}`} onClick={() => setTab('official')}>
              {t('map.tabOfficial')}
            </button>
            <a className="btn btn-gold ms-auto" href={UNIRANK_MAP_URL} target="_blank" rel="noopener noreferrer">
              {t('map.openExternal')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" />
            </a>
          </div>

          {tab === 'interactive' ? (
            <MapContainer center={CAMPUS_CENTER} zoom={16} className="map-box" scrollWheelZoom>
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker center={CAMPUS_CENTER} radius={11} pathOptions={{ color: '#0b2a4a', fillColor: '#f2b705', fillOpacity: 0.9 }}>
                <Popup>{t('map.campus')}</Popup>
              </CircleMarker>
            </MapContainer>
          ) : (
            <>
              <iframe title="BUP 2D map" src={UNIRANK_MAP_URL} className="map-box border-0 w-100" loading="lazy" />
              <p className="small text-muted mt-2 mb-0">{t('map.note')}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
