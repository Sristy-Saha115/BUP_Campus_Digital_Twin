import { Link } from 'react-router-dom';
import { useLang } from '../../i18n.jsx';
import MapBadge from './MapBadge.jsx';

export default function FacilityCard({ f }) {
  const { t } = useLang();
  const verified = f.mapStatus === 'verified';
  return (
    <article className={`ex-card ${verified ? 'is-verified' : ''}`}>
      <div className="ex-card-head">
        <div className="ex-card-icon" aria-hidden="true"><i className={`fa-solid ${f.icon}`} /></div>
        <div className="min-w-0">
          <h3>{f.name}</h3>
          <div className="ex-card-cat">{t(`ex.cat.${f.category}`)}</div>
        </div>
      </div>

      <div className="mt-2"><MapBadge status={f.mapStatus} /></div>

      <p>{f.summary}</p>

      {f.highlights.length > 0 && (
        <ul className="ex-list">{f.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
      )}

      {f.location.text && (
        <div className="ex-meta"><strong>{t('ex.where')}:</strong> {f.location.text}</div>
      )}

      {f.hours && (
        <div className="ex-meta">
          <strong>{t('ex.hours')}:</strong>
          <div className="table-responsive">
            <table className="ex-hours">
              <thead><tr>{f.hours.header.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{f.hours.rows.map((r) => <tr key={r[0]}>{r.map((c) => <td key={c}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {f.hours.note && <small className="text-muted">{f.hours.note}</small>}
        </div>
      )}

      {f.phone && <div className="ex-meta"><strong>{t('ex.phone')}:</strong> <a href={`tel:${f.phone.replace(/[^\d+]/g, '')}`}>{f.phone}</a></div>}

      {f.missing.length > 0 && (
        <div className="ex-missing">
          <i className="fa-solid fa-circle-info" />
          <strong>{t('ex.notPublished')}:</strong>{' '}
          {f.missing.map((m) => t(`ex.missing.${m}`)).join(' \u00b7 ')}
        </div>
      )}

      <div className="ex-actions">
        {verified ? (
          <Link className="btn btn-sm btn-navy" to={`/map?facility=${f.slug}`}>
            <i className="fa-solid fa-map-location-dot me-1" />{t('ex.viewOnMap')}
          </Link>
        ) : (
          <>
            <span className="btn btn-sm btn-outline-navy ex-disabled" aria-disabled="true">{t('ex.mapUnavailable')}</span>
            <Link className="btn btn-sm btn-outline-navy" to={`/explorer?tab=map&facility=${f.slug}`}>
              <i className="fa-solid fa-circle-info me-1" />{t('ex.locationDetails')}
            </Link>
          </>
        )}
        {f.appLink && <Link className="btn btn-sm btn-gold" to={f.appLink.to}>{f.appLink.label} <i className="fa-solid fa-arrow-right ms-1" /></Link>}
        <a className="btn btn-sm btn-outline-secondary" href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
          {t('ex.source')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" />
        </a>
      </div>
    </article>
  );
}
