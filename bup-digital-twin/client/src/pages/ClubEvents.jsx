import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';

const EMPTY = { clubName: '', title: '', date: '', venue: '', registrationUrl: '', details: '' };

export default function ClubEvents() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);

  const loadEvents = () => api('/clubs/events').then((d) => setEvents(d.events)).catch(() => {});
  useEffect(() => {
    api('/clubs').then((d) => setClubs(d.clubs)).catch((e) => setMsg({ type: 'danger', text: e.message }));
    loadEvents();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try { await api('/clubs/events', { method: 'POST', body: form }); setForm(EMPTY); loadEvents(); }
    catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };
  const remove = async (id) => {
    try { await api(`/clubs/events/${id}`, { method: 'DELETE' }); loadEvents(); }
    catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <>
      <PageHero icon="fa-people-group" title={t('clubs.title')} sub={t('clubs.sub')} />

      {/* Section background: /public/img/clubs-bg.jpg (optional) over a club-themed gradient */}
      <section className="clubs-section">
        <div className="container py-5">
          <div className="row g-4">
            {clubs.map((c) => (
              <div className="col-md-6 col-lg-4" key={c._id}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className={`club-card club-${c.slug}`}
                   style={{ '--club-photo': `url(/img/clubs/${c.slug}.jpg)` }}>
                  <i className={`fa-solid ${c.icon} club-watermark`} />
                  <div className="club-card-body">
                    <span className="club-category">{lang === 'bn' ? c.categoryBn : c.category}</span>
                    <h3>{c.name}</h3>
                    <p>{lang === 'bn' ? c.descriptionBn : c.description}</p>
                    <span className="club-open">{t('clubs.open')} <i className="fa-brands fa-facebook ms-1" /></span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-4">
        <div className="panel">
          <h2 className="h4">{t('events.add')}</h2>
          {!user ? (
            <div className="alert alert-info">{t('common.loginFirst')} <Link to="/login">{t('nav.login')}</Link></div>
          ) : (
            <form className="row g-3" onSubmit={submit}>
              <div className="col-md-6">
                <label className="form-label">{t('events.club')}</label>
                <select className="form-select" value={form.clubName} onChange={set('clubName')} required>
                  <option value="">{t('slot.choose')}</option>
                  {clubs.map((c) => <option key={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-6"><label className="form-label">{t('events.name')}</label><input className="form-control" value={form.title} onChange={set('title')} required /></div>
              <div className="col-md-4"><label className="form-label">{t('events.date')}</label><input type="date" className="form-control" value={form.date} onChange={set('date')} /></div>
              <div className="col-md-4"><label className="form-label">{t('events.venue')}</label><input className="form-control" value={form.venue} onChange={set('venue')} /></div>
              <div className="col-md-4"><label className="form-label">{t('events.url')}</label><input type="url" className="form-control" placeholder="https://" value={form.registrationUrl} onChange={set('registrationUrl')} /></div>
              <div className="col-12"><label className="form-label">{t('events.details')}</label><textarea className="form-control" rows="2" value={form.details} onChange={set('details')} /></div>
              <div className="col-12"><button className="btn btn-gold">{t('events.publish')}</button></div>
            </form>
          )}
          <Alert msg={msg} />

          <hr />
          <h3 className="h5">{t('events.saved')}</h3>
          {events.length === 0 && <p className="text-muted small">{t('common.none')}</p>}
          {events.map((e) => (
            <div className="event-row" key={e._id}>
              <div>
                <strong>{e.title}</strong>
                <div className="small text-muted">{e.clubName} · {e.date || t('events.tba')} · {e.venue || t('events.tba')}</div>
                {e.details && <p className="small mb-0">{e.details}</p>}
              </div>
              <div className="d-flex gap-2 align-items-start">
                {e.registrationUrl && <a href={e.registrationUrl} target="_blank" rel="noopener noreferrer">{t('events.register')}</a>}
                {user && String(e.createdBy) === user.id && <button className="btn btn-sm btn-outline-danger" onClick={() => remove(e._id)}>{t('events.delete')}</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
