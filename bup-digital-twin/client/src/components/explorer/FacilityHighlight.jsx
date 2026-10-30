import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import { api } from '../../api';
import { useLang } from '../../i18n.jsx';

// Used by the EXISTING /map page: /map?facility=<slug>
//  - <FacilityHighlight/> goes INSIDE <MapContainer> and highlights a facility only when its position is verified.
//  - <FacilityMapNotice/> goes above the map and tells the visitor what is (not) shown.
// With no ?facility= in the URL both render nothing, so the normal map page is unchanged.

const cache = new Map();
function loadFacility(slug) {
  if (!cache.has(slug)) {
    cache.set(slug, api(`/explorer/facilities/${encodeURIComponent(slug)}`)
      .then((d) => d.facility)
      .catch((e) => { cache.delete(slug); return e.status === 404 ? { notFound: true } : null; }));
  }
  return cache.get(slug);
}

function useSelectedFacility() {
  const [params] = useSearchParams();
  const slug = (params.get('facility') || '').toLowerCase();
  const [f, setF] = useState(null);
  useEffect(() => {
    let live = true;
    setF(null);
    if (/^[a-z0-9-]{1,60}$/.test(slug)) loadFacility(slug).then((x) => live && setF(x));
    return () => { live = false; };
  }, [slug]);
  return { slug, f };
}

export function FacilityHighlight() {
  const map = useMap();
  const { f } = useSelectedFacility();
  const ref = useRef(null);
  const coords = f && f.mapStatus === 'verified' ? f.location.coords : null;

  useEffect(() => {
    if (!coords) return undefined;
    map.flyTo(coords, 18, { duration: 0.8 });
    const id = setTimeout(() => { if (ref.current) ref.current.openPopup(); }, 900);
    return () => clearTimeout(id);
  }, [coords, map]);

  if (!coords) return null;
  return (
    <>
      <CircleMarker center={coords} radius={24} interactive={false} pathOptions={{ color: '#f2b705', weight: 2, fillColor: '#f2b705', fillOpacity: 0.25 }} />
      <CircleMarker ref={ref} center={coords} radius={9} pathOptions={{ color: '#0b2a4a', weight: 3, fillColor: '#f2b705', fillOpacity: 1 }}>
        <Popup>
          <strong>{f.name}</strong>
          {f.location.text && <div>{f.location.text}</div>}
        </Popup>
      </CircleMarker>
    </>
  );
}

export function FacilityMapNotice() {
  const { t } = useLang();
  const { slug, f } = useSelectedFacility();
  if (!slug || !f) return null;
  if (f.notFound) return <div className="alert alert-warning py-2">{t('ex.map.notFound')}</div>;
  const verified = f.mapStatus === 'verified';
  return (
    <div className={`alert ${verified ? 'alert-info' : 'alert-warning'} py-2 d-flex flex-wrap gap-2 align-items-center`}>
      <div className="me-auto">
        <strong>{verified ? `${t('ex.map.showing')}: ` : ''}{f.name}</strong>
        {verified ? null : <> - {t('ex.map.notVerifiedMsg')}</>}
        {!verified && (f.location.text
          ? <div className="small">{t('ex.map.websiteSays')}: {f.location.text}</div>
          : <div className="small">{t('ex.map.noTextMsg')}</div>)}
      </div>
      <Link className="btn btn-sm btn-outline-navy" to="/explorer?tab=map">Campus Explorer</Link>
    </div>
  );
}
