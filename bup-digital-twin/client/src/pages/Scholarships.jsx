import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { api } from '../api';

const LEVELS = ['Secondary', 'Higher Secondary', 'Undergraduate', 'Masters', 'PhD'];
const CATS = [['', 'sch.all'], ['Government', 'sch.government'], ['International', 'sch.international'], ['University', 'sch.university']];

const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 864e5) : null);

function loadSaved() {
  try { return JSON.parse(localStorage.getItem('bup_saved_sch') || '[]'); } catch { return []; }
}

export default function Scholarships() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState('deadline');
  const [cat, setCat] = useState('');
  const [fully, setFully] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [gpa, setGpa] = useState('');
  const [scale, setScale] = useState('4');
  const [saved, setSaved] = useState(loadSaved);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api('/scholarships').then((d) => setItems(d.scholarships)).catch((e) => setError(e.message));
  }, []);

  const toggleSave = (id) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem('bup_saved_sch', JSON.stringify(next)); } catch { /* ignore */ }
  };

  const countries = useMemo(() => [...new Set(items.map((s) => s.country).filter(Boolean))].sort(), [items]);
  const gpaNum = parseFloat(gpa);
  const hasGpa = !Number.isNaN(gpaNum) && gpa !== '';
  const meets = (s) => gpaNum / Number(scale) >= s.minGpa / s.gpaScale;

  const list = useMemo(() => {
    const text = q.trim().toLowerCase();
    let r = items.filter((s) => {
      if (cat && s.category !== cat) return false;
      if (level && !s.levels.includes(level)) return false;
      if (country && s.country !== country) return false;
      if (fully && !s.fullyFunded) return false;
      if (openOnly) { const d = daysLeft(s.deadline); if (d !== null && d < 0) return false; }
      if (savedOnly && !saved.includes(s._id)) return false;
      if (hasGpa && !meets(s)) return false;
      if (text && ![s.title, s.provider, s.country, s.description].join(' ').toLowerCase().includes(text)) return false;
      return true;
    });
    if (sort === 'name') r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    else r = [...r].sort((a, b) => (daysLeft(a.deadline) ?? 99999) - (daysLeft(b.deadline) ?? 99999));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, level, country, sort, cat, fully, openOnly, savedOnly, saved, gpa, scale]);

  const closingSoon = items.filter((s) => { const d = daysLeft(s.deadline); return d !== null && d >= 0 && d <= 30; }).length;
  const savedCount = items.filter((s) => saved.includes(s._id)).length;

  const reset = () => { setGpa(''); setScale('4'); };
  const catClass = (c) => `sch-tag sch-tag-${c.toLowerCase()}`;

  return (
    <>
      <section className="sch-hero">
        <div className="container">
          <h1><i className="fa-solid fa-graduation-cap me-2" />{t('sch.title')}</h1>
          <p>{t('sch.sub')}</p>
        </div>
      </section>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-3">
          <div className="col-md-4"><div className="sch-stat"><strong>{items.length}</strong><span>{t('sch.total')}</span></div></div>
          <div className="col-md-4"><div className="sch-stat gold"><strong>{closingSoon}</strong><span>{t('sch.closing')}</span></div></div>
          <div className="col-md-4"><div className="sch-stat green"><strong>{savedCount}</strong><span>{t('sch.saved')}</span></div></div>
        </div>

        <div className="alert alert-info py-2"><i className="fa-solid fa-circle-info me-2" />{t('sch.sampleNote')}</div>

        <div className="panel mb-4">
          <div className="row g-2">
            <div className="col-lg-6">
              <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('sch.searchPh')} />
            </div>
            <div className="col-6 col-lg-2">
              <select className="form-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">{t('sch.allLevels')}</option>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <select className="form-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">{t('sch.allCountries')}</option>
                {countries.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="deadline">{t('sch.sortDeadline')}</option>
                <option value="name">{t('sch.sortName')}</option>
              </select>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
            {CATS.map(([v, key]) => (
              <button key={v} type="button" className={`chip ${cat === v ? 'active' : ''}`} onClick={() => setCat(v)}>{t(key)}</button>
            ))}
            <label className="ms-2 small"><input type="checkbox" className="form-check-input me-1" checked={fully} onChange={(e) => setFully(e.target.checked)} />{t('sch.fully')}</label>
            <label className="small"><input type="checkbox" className="form-check-input me-1" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />{t('sch.open')}</label>
            <label className="small"><input type="checkbox" className="form-check-input me-1" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} />{t('sch.savedOnly')}</label>
          </div>

          <div className="elig-box mt-3">
            <div className="fw-bold mb-1"><i className="fa-solid fa-wand-magic-sparkles me-2" />{t('sch.eligFinder')}</div>
            <div className="small text-muted mb-2">{t('sch.eligHint')}</div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <input className="form-control" style={{ width: 110 }} type="number" step="0.01" min="0" max="5" placeholder="3.75" value={gpa} onChange={(e) => setGpa(e.target.value)} />
              <select className="form-select" style={{ width: 230 }} value={scale} onChange={(e) => setScale(e.target.value)}>
                <option value="4">{t('sch.out4')}</option>
                <option value="5">{t('sch.out5')}</option>
              </select>
              <button type="button" className="btn btn-outline-navy rounded-pill" onClick={reset}>{t('sch.reset')}</button>
            </div>
          </div>
        </div>

        <h2 className="h4 fw-bold mb-3">{list.length} {t('sch.found')}</h2>
        {list.length === 0 && <p className="text-muted">{t('sch.none')}</p>}

        <div className="row g-4">
          {list.map((s) => {
            const d = daysLeft(s.deadline);
            const isSaved = saved.includes(s._id);
            return (
              <div className="col-md-6 col-lg-4" key={s._id}>
                <article className="sch-card h-100">
                  <div className="d-flex align-items-start">
                    <span className={catClass(s.category)}>{s.category} · {s.country}</span>
                    <button type="button" className="heart ms-auto" onClick={() => toggleSave(s._id)} aria-label="Save">
                      <i className={`${isSaved ? 'fa-solid text-danger' : 'fa-regular'} fa-heart`} />
                    </button>
                  </div>
                  <h3>{s.title}</h3>
                  <div className="text-muted small mb-2">{s.provider}</div>
                  <p className="mb-2">{s.description}</p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {s.fullyFunded && <span className="pill pill-green"><i className="fa-solid fa-coins me-1" />{t('sch.fully')}</span>}
                    <span className="pill">GPA {s.minGpa}+/{s.gpaScale}</span>
                    {hasGpa && <span className="pill pill-green"><i className="fa-solid fa-check me-1" />{t('sch.qualify')}</span>}
                  </div>
                  <div className="d-flex align-items-center mt-auto">
                    {d === null
                      ? <span className="pill pill-gold"><i className="fa-solid fa-infinity me-1" />{t('sch.rolling')}</span>
                      : d < 0
                        ? <span className="pill">{t('sch.closed')}</span>
                        : <span className="pill pill-gold"><i className="fa-regular fa-clock me-1" />{d} {t('sch.daysLeft')}</span>}
                    <button type="button" className="btn btn-outline-navy rounded-pill ms-auto" onClick={() => setDetail(s)}>{t('sch.details')}</button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      {detail && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.5)' }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <span className={catClass(detail.category)}>{detail.category} · {detail.country}</span>
                  <h5 className="modal-title mt-2">{detail.title}</h5>
                  <div className="small text-muted">{detail.provider}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setDetail(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>{detail.description}</p>
                <ul className="list-unstyled small mb-3">
                  <li><strong>{t('sch.levels')}:</strong> {detail.levels.join(', ')}</li>
                  <li><strong>{t('sch.minGpa')}:</strong> {detail.minGpa} / {detail.gpaScale}</li>
                  <li><strong>{t('sch.funding')}:</strong> {detail.fullyFunded ? t('sch.fully') : t('sch.partial')}</li>
                  <li><strong>{t('sch.deadline')}:</strong> {detail.deadline ? new Date(detail.deadline).toLocaleDateString() : t('sch.rolling')}</li>
                </ul>
                <div className="fw-bold small mb-1">{t('sch.requirements')}</div>
                <ul className="small">{detail.eligibility.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <div className="alert alert-warning small py-2 mb-0">{t('sch.sampleNote')}</div>
              </div>
              <div className="modal-footer">
                <a className="btn btn-navy" href={detail.applyUrl} target="_blank" rel="noopener noreferrer">{t('sch.apply')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" /></a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
