import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';

export default function SmartSearch() {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const run = async (e) => {
    e.preventDefault();
    setError('');
    try { setResults((await api(`/search?q=${encodeURIComponent(q)}`)).results); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <PageHero icon="fa-magnifying-glass-location" title={t('search.title')} sub={t('search.sub')} />
      <div className="container py-4">
        <div className="panel">
          <form className="input-group input-group-lg" onSubmit={run}>
            <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} />
            <button className="btn btn-gold fw-bold">{t('search.button')}</button>
          </form>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {results && (
            <div className="mt-4">
              {results.length === 0 && <p className="text-muted">{t('search.noResults')}</p>}
              {results.map((r, i) => (
                <div className="search-item" key={i}>
                  <span className="badge text-bg-secondary me-2">{r.type}</span>
                  <strong>{r.title}</strong>
                  <div className="small text-muted">{r.details}</div>
                  {r.link && <Link to={r.link} className="small">{t('common.open')} →</Link>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
