import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import ScholarshipCard, { levelText } from '../components/ScholarshipCard.jsx';
import ScholarshipModal from '../components/ScholarshipModal.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api, getToken } from '../api';
import '../scholarships.css';

const STATUS_RANK = { Open: 0, Varies: 1, Upcoming: 2, Closed: 3 };
const NO_FILTERS = { q: '', country: '', level: '', status: '' };

const LEVELS = ['Secondary', 'Higher Secondary', 'Undergraduate', 'Masters', 'PhD'];
const CATS = [['', 'sch.all'], ['Government', 'sch.government'], ['International', 'sch.international'], ['University', 'sch.university']];

const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 864e5) : null);

function loadSaved() {
  try { return JSON.parse(localStorage.getItem('bup_saved_sch') || '[]'); } catch { return []; }
}

export default function Scholarships() {
  const { t } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [waited, setWaited] = useState(false);   // stop showing "loading" if the saved token turns out to be invalid
  const closeModal = useCallback(() => setSelected(null), []);

  useEffect(() => {
    const id = setTimeout(() => setWaited(true), 2000);
    return () => clearTimeout(id);
  }, []);

  const allowed = !!user && (user.role === 'Student' || user.role === 'Faculty');

  // The server decides what each role may see: Faculty never receive the BUP scholarships
  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    api('/scholarships')
      .then((d) => { setItems(d.scholarships); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);   // eslint-disable-line react-hooks/exhaustive-deps

  const bup = useMemo(() => items.filter((s) => s.category === 'BUP'), [items]);
  const intl = useMemo(() => items.filter((s) => s.category === 'International'), [items]);

  const options = useMemo(() => ({
    countries: [...new Set(intl.map((s) => s.country))].sort(),
    levels: [...new Set(intl.flatMap((s) => (Array.isArray(s.level) ? s.level : [s.level])))].filter(Boolean).sort(),
    statuses: [...new Set(intl.map((s) => s.status))].sort((a, b) => STATUS_RANK[a] - STATUS_RANK[b]),
  }), [intl]);

  const shown = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return intl
      .filter((s) => !filters.country || s.country === filters.country)
      .filter((s) => !filters.level || (Array.isArray(s.level) ? s.level : [s.level]).includes(filters.level))
      .filter((s) => !filters.status || s.status === filters.status)
      .filter((s) => !q || [s.title, s.country, levelText(s), s.funding].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (STATUS_RANK[a.status] - STATUS_RANK[b.status]) || (a.order - b.order));
  }, [intl, filters]);

  const setF = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const filtersActive = Object.values(filters).some(Boolean);

  const hero = <PageHero icon="fa-graduation-cap" title={t('sch.title')} sub={t('sch.sub')} />;

  // user is still being restored from the saved login token
  if (!user && getToken() && !waited) {
    return <>{hero}<div className="container py-4 text-muted">{t('common.loading')}</div></>;
  }
  if (!user) {
    return (
      <>
        {hero}
        <div className="container py-4">
          <div className="panel text-center">
            <p className="mb-3">{t('common.loginFirst')}</p>
            <Link className="btn btn-navy" to="/login">{t('nav.login')}</Link>
          </div>
        </div>
      </>
    );
  }
  if (!allowed) {
    return <>{hero}<div className="container py-4"><div className="alert alert-info">{t('sch.restricted')}</div></div></>;
  }

  return (
    <>
      {hero}
      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && !error && <p className="text-muted">{t('common.loading')}</p>}

        {/* BUP scholarships: students only (the server never sends them to faculty) */}
        {bup.length > 0 && (
          <section className="mb-5">
            <h2 className="sch-section-title"><i className="fa-solid fa-building-columns me-2 gold" />{t('sch.bup')}</h2>
            <p className="text-muted small">{t('sch.bupNote')}</p>
            <div className="row g-4">
              {bup.map((s) => (
                <div className="col-md-6 col-lg-3" key={s._id}>
                  <ScholarshipCard s={s} onOpen={setSelected} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* International scholarships: students and faculty */}
        {(intl.length > 0 || filtersActive) && (
          <section>
            <h2 className="sch-section-title"><i className="fa-solid fa-earth-asia me-2 gold" />{t('sch.intl')}</h2>

            <div className="sch-filters panel mb-4">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-lg-4">
                  <input
                    type="search"
                    className="form-control"
                    placeholder={t('sch.search')}
                    aria-label={t('sch.search')}
                    value={filters.q}
                    onChange={setF('q')}
                  />
                </div>
                <div className="col-6 col-lg-2">
                  <select className="form-select" aria-label={t('sch.country')} value={filters.country} onChange={setF('country')}>
                    <option value="">{t('sch.country')}: {t('sch.all')}</option>
                    {options.countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-6 col-lg-2">
                  <select className="form-select" aria-label={t('sch.level')} value={filters.level} onChange={setF('level')}>
                    <option value="">{t('sch.level')}: {t('sch.all')}</option>
                    {options.levels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-6 col-lg-2">
                  <select className="form-select" aria-label={t('sch.status')} value={filters.status} onChange={setF('status')}>
                    <option value="">{t('sch.status')}: {t('sch.all')}</option>
                    {options.statuses.map((st) => <option key={st} value={st}>{t(`sch.${st.toLowerCase()}`)}</option>)}
                  </select>
                </div>
                <div className="col-6 col-lg-2">
                  <button type="button" className="btn btn-outline-navy w-100" onClick={() => setFilters(NO_FILTERS)} disabled={!filtersActive}>
                    {t('sch.reset')}
                  </button>
                </div>
              </div>
              <div className="small text-muted mt-2">{shown.length} / {intl.length} {t('sch.results')}</div>
            </div>

            {shown.length === 0 ? (
              <div className="panel text-center text-muted">{t('sch.empty')}</div>
            ) : (
              <div className="row g-4">
                {shown.map((s) => (
                  <div className="col-md-6 col-lg-4" key={s._id}>
                    <ScholarshipCard s={s} onOpen={setSelected} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && !error && items.length === 0 && <div className="panel text-center text-muted">{t('sch.none')}</div>}
      </div>

      {selected && <ScholarshipModal s={selected} onClose={closeModal} />}
    </>
  );
}
