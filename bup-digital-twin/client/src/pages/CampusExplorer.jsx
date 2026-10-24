import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import FacilityCard from '../components/explorer/FacilityCard.jsx';
import NewsCard from '../components/explorer/NewsCard.jsx';
import ExplorerMap from '../components/explorer/ExplorerMap.jsx';
import MapBadge from '../components/explorer/MapBadge.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';
import '../explorer.css';

// PUBLIC page: no login, no role checks. It only calls the public /api/explorer/* endpoints.

const TABS = [
  ['facilities', 'ex.tabFacilities', 'fa-building-columns'],
  ['news', 'ex.tabNews', 'fa-newspaper'],
  ['map', 'ex.tabMap', 'fa-location-crosshairs'],
];
const NEWS_TYPES = ['news', 'event', 'notice'];

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const matches = (hay, q) => norm(q).split(' ').filter(Boolean).every((w) => hay.includes(w));

// Loads one public endpoint with loading / error / reload
function useLoad(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    api(path)
      .then((data) => live && setState({ data, loading: false, error: '' }))
      .catch((e) => live && setState({ data: null, loading: false, error: e.message }));
    return () => { live = false; };
  }, [path, n]);
  return { ...state, reload: () => setN((x) => x + 1) };
}

function Skeletons({ count = 6 }) {
  return (
    <div className="row g-3" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="col-12 col-md-6 col-xl-4" key={i}><div className="ex-skel" /></div>
      ))}
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  const { t } = useLang();
  return (
    <div className="ex-empty" role="alert">
      <i className="fa-solid fa-triangle-exclamation" />
      <strong>{t('ex.errorTitle')}</strong>
      <div className="small mb-3">{message}</div>
      <button className="btn btn-navy btn-sm" onClick={onRetry}>{t('ex.retry')}</button>
    </div>
  );
}

function Empty({ text, onClear }) {
  const { t } = useLang();
  return (
    <div className="ex-empty">
      <i className="fa-regular fa-folder-open" />
      <div className="mb-2">{text}</div>
      {onClear && <button className="btn btn-outline-navy btn-sm" onClick={onClear}>{t('ex.clear')}</button>}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="ex-search input-group">
      <span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass" /></span>
      <input
        type="search"
        className="form-control"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={80}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="ex-chips" role="group">
      {options.map(([key, label, icon]) => (
        <button key={String(key) || 'all'} type="button" className={`chip ${value === key ? 'active' : ''}`} aria-pressed={value === key} onClick={() => onChange(key)}>
          {icon && <i className={`fa-solid ${icon}`} />}{label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- 1. Library & Facilities
function FacilitiesTab({ load }) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const { data, loading, error, reload } = load;

  const list = useMemo(() => {
    if (!data) return [];
    return data.facilities.filter((f) => (!cat || f.category === cat) &&
      matches(norm([f.name, f.categoryLabel, f.summary, ...f.highlights, f.location.text].join(' ')), q));
  }, [data, q, cat]);

  if (loading) return <Skeletons />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const clear = () => { setQ(''); setCat(''); };
  const chips = [['', t('ex.all')], ...data.categories.map((c) => [c.key, `${t(`ex.cat.${c.key}`)} (${c.count})`, c.icon])];
  return (
    <>
      <div className="ex-toolbar mb-3">
        <SearchBox value={q} onChange={setQ} placeholder={t('ex.searchFacilities')} />
      </div>
      <div className="mb-3"><Chips options={chips} value={cat} onChange={setCat} /></div>
      <div className="small text-muted mb-2" aria-live="polite">{list.length} {t('ex.results')}</div>
      {list.length === 0
        ? <Empty text={t('ex.noFacilities')} onClear={q || cat ? clear : null} />
        : <div className="row g-3">{list.map((f) => <div className="col-12 col-md-6 col-xl-4" key={f.slug}><FacilityCard f={f} /></div>)}</div>}
    </>
  );
}

// ---------------------------------------------------------------- 2. Campus News & Events
function NewsTab({ load, facilityNames }) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const { data, loading, error, reload } = load;

  const list = useMemo(() => {
    if (!data) return [];
    return data.items.filter((n) => (!type || n.type === type) &&
      matches(norm([n.title, n.summary, n.venue, n.eventDate].join(' ')), q));
  }, [data, q, type]);

  if (loading) return <Skeletons count={4} />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const clear = () => { setQ(''); setType(''); };
  const chips = [['', t('ex.all')], ...NEWS_TYPES.map((k) => [k, t(`ex.type.${k}`)])];
  return (
    <>
      <div className="ex-toolbar mb-3">
        <SearchBox value={q} onChange={setQ} placeholder={t('ex.searchNews')} />
      </div>
      <div className="mb-3"><Chips options={chips} value={type} onChange={setType} /></div>
      {(type === 'event' || type === '') && data.upcomingEvents === 0 && (
        <div className="alert alert-light border small py-2">{t('ex.noUpcoming')}</div>
      )}
      <div className="small text-muted mb-2" aria-live="polite">{list.length} {t('ex.results')} <span className="ms-2">{data.note}</span></div>
      {list.length === 0
        ? <Empty text={t('ex.noNews')} onClear={q || type ? clear : null} />
        : <div className="d-flex flex-column gap-3">{list.map((n) => <NewsCard key={n.id} n={n} facilityName={n.facilitySlug ? facilityNames[n.facilitySlug] : null} />)}</div>}
    </>
  );
}

// ---------------------------------------------------------------- 3. Search & Show on Map
function MapTab({ load }) {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const { data, loading, error, reload } = load;
  const selectedSlug = (params.get('facility') || '').toLowerCase();

  const select = useCallback((slug) => setParams({ tab: 'map', facility: slug }), [setParams]);
  const list = useMemo(() => {
    if (!data) return [];
    return data.facilities.filter((f) => (!onlyVerified || f.mapStatus === 'verified') &&
      matches(norm([f.name, f.categoryLabel, f.location.text, ...f.highlights].join(' ')), q));
  }, [data, q, onlyVerified]);

  if (loading) return <Skeletons count={2} />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const selected = data.facilities.find((f) => f.slug === selectedSlug) || null;

  return (
    <div className="row g-3">
      <div className="col-lg-5">
        <div className="ex-toolbar mb-2">
          <SearchBox value={q} onChange={setQ} placeholder={t('ex.searchMap')} />
        </div>
        <div className="mb-2">
          <Chips options={[[false, t('ex.all')], [true, t('ex.map.onlyVerified'), 'fa-location-dot']]} value={onlyVerified} onChange={setOnlyVerified} />
        </div>
        <div className="small text-muted mb-2" aria-live="polite">
          {data.verifiedCount} / {data.total} {t('ex.map.counts')}
        </div>
        {list.length === 0 ? (
          <Empty
            text={onlyVerified && !q ? t('ex.map.noneVerified') : t('ex.noFacilities')}
            onClear={q || onlyVerified ? () => { setQ(''); setOnlyVerified(false); } : null}
          />
        ) : (
          <div className="ex-results" role="list">
            {list.map((f) => (
              <button key={f.slug} role="listitem" type="button" className={`ex-result ${f.slug === selectedSlug ? 'active' : ''}`} onClick={() => select(f.slug)}>
                <strong>{f.name}</strong>
                <small>{f.location.text || t('ex.map.none')}</small>
                <div className="mt-1"><MapBadge status={f.mapStatus} /></div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="col-lg-7">
        {data.verifiedCount === 0 && <div className="alert alert-warning py-2 small">{t('ex.map.noneVerified')}</div>}
        <ExplorerMap facilities={data.facilities} selectedSlug={selectedSlug} onSelect={select} />
        <div className="ex-selected mt-3">
          {!selected ? (
            <span className="text-muted">{t('ex.map.pickHint')}</span>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                <strong className="text-navy">{t('ex.map.selected')}: {selected.name}</strong>
                <MapBadge status={selected.mapStatus} />
              </div>
              {selected.location.text
                ? <div className="small">{t('ex.map.websiteSays')}: {selected.location.text}</div>
                : <div className="small">{t('ex.map.noTextMsg')}</div>}
              {selected.mapStatus !== 'verified' && <div className="small text-muted mt-1">{t('ex.map.notVerifiedMsg')}</div>}
              <div className="d-flex flex-wrap gap-2 mt-2">
                {selected.mapStatus === 'verified' && (
                  <Link className="btn btn-sm btn-navy" to={`/map?facility=${selected.slug}`}>{t('ex.viewOnMap')}</Link>
                )}
                <Link className="btn btn-sm btn-outline-navy" to="/map">{t('ex.map.openFull')}</Link>
                <a className="btn btn-sm btn-outline-secondary" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {t('ex.source')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- page
export default function CampusExplorer() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const wanted = params.get('tab');
  const tab = TABS.some(([k]) => k === wanted) ? wanted : 'facilities';

  const facilities = useLoad('/explorer/facilities');
  const news = useLoad('/explorer/news');
  const names = useMemo(
    () => Object.fromEntries((facilities.data ? facilities.data.facilities : []).map((f) => [f.slug, f.name])),
    [facilities.data]
  );
  const captured = (facilities.data && facilities.data.capturedAt) || (news.data && news.data.capturedAt) || '';

  return (
    <>
      <PageHero icon="fa-compass" title={t('ex.title')} sub={t('ex.sub')} />
      <div className="container py-4">
        <div className="ex-source-note mb-3">
          <i className="fa-solid fa-circle-info me-2 text-warning" />
          {t('ex.sourceNote')} <strong>{captured || '...'}</strong>. {t('ex.sourceNote2')}
        </div>

        <div className="panel">
          <ul className="nav fd-tabs mb-3" role="tablist">
            {TABS.map(([key, label, icon]) => (
              <li className="nav-item" key={key} role="presentation">
                <button type="button" role="tab" aria-selected={tab === key} className={`nav-link ${tab === key ? 'active' : ''}`} onClick={() => setParams({ tab: key })}>
                  <i className={`fa-solid ${icon} me-2`} />{t(label)}
                </button>
              </li>
            ))}
          </ul>

          {tab === 'facilities' && <FacilitiesTab load={facilities} />}
          {tab === 'news' && <NewsTab load={news} facilityNames={names} />}
          {tab === 'map' && <MapTab load={facilities} />}
        </div>
      </div>
    </>
  );
}
