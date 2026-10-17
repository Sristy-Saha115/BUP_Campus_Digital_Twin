import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';

export default function Scholarships() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/scholarships').then((d) => setItems(d.scholarships)).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHero icon="fa-graduation-cap" title={t('sch.title')} sub={t('sch.sub')} />
      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="row g-4">
          {items.map((s) => (
            <div className="col-md-6 col-lg-4" key={s._id}>
              <article className="panel h-100">
                <span className="badge text-bg-warning mb-2">{s.level || '—'}</span>
                <h2 className="h5">{s.title}</h2>
                <p className="text-muted small">{s.provider}</p>
                <p>{s.details}</p>
                <p className="small">
                  <strong>{t('sch.deadline')}:</strong> {s.deadline || t('sch.check')}<br />
                  <strong>{t('sch.eligibility')}:</strong> {s.eligibility || '—'}
                </p>
                <a className="btn btn-navy" href={s.applyUrl} target="_blank" rel="noopener noreferrer">{t('sch.official')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" /></a>
              </article>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
