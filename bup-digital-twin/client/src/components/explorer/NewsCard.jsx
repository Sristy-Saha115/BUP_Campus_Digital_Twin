import { Link } from 'react-router-dom';
import { useLang } from '../../i18n.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// date is an ISO day ("2026-09-30"): split it by hand so time zones can never shift the day
function parts(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return { y, m: MONTHS[(m || 1) - 1], d };
}

export default function NewsCard({ n, facilityName }) {
  const { t } = useLang();
  const { y, m, d } = parts(n.date);
  return (
    <article className={`ex-news is-${n.type}`}>
      <div className="ex-date" title={t('ex.dateListed')}>
        <b>{d}</b>
        <span>{m} {y}</span>
      </div>
      <div className="min-w-0">
        <span className={`pill ${n.type === 'event' ? 'pill-gold' : n.type === 'notice' ? 'ex-pill-none' : 'pill-green'}`}>
          {t(`ex.badge.${n.type}`)}
        </span>
        <h3>{n.title}</h3>
        {n.summary && <p>{n.summary}</p>}
        <div className="ex-news-foot">
          {n.eventDate && <span><i className="fa-regular fa-calendar me-1" />{t('ex.eventDay')}: {n.eventDate}</span>}
          {n.venue && <span><i className="fa-solid fa-location-dot me-1" />{t('ex.venue')}: {n.venue}</span>}
          {n.facilitySlug && facilityName && (
            <Link to={`/explorer?tab=map&facility=${n.facilitySlug}`}>{t('ex.related')}: {facilityName}</Link>
          )}
          <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer">
            {t('ex.source')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" />
          </a>
        </div>
      </div>
    </article>
  );
}
