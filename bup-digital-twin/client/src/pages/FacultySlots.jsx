import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';

const today = () => new Date().toISOString().slice(0, 10);

export default function FacultySlots() {
  const { t } = useLang();
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [taken, setTaken] = useState([]);
  const [mine, setMine] = useState([]);
  const [form, setForm] = useState({ faculty: '', date: '', timeSlot: '', reason: '' });
  const [msg, setMsg] = useState(null);

  const loadMine = () => user && api('/slots/mine').then((d) => setMine(d.bookings)).catch(() => {});

  useEffect(() => {
    api('/slots/faculty').then((d) => { setFaculty(d.faculty); setTimeSlots(d.timeSlots); }).catch((e) => setMsg({ type: 'danger', text: e.message }));
  }, []);
  useEffect(() => { loadMine(); }, [user]);
  useEffect(() => {
    if (!form.faculty || !form.date) { setTaken([]); return; }
    api(`/slots/availability?faculty=${encodeURIComponent(form.faculty)}&date=${form.date}`).then((d) => setTaken(d.taken)).catch(() => {});
  }, [form.faculty, form.date]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value, ...(k !== 'timeSlot' && k !== 'reason' ? { timeSlot: '' } : {}) });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const d = await api('/slots', { method: 'POST', body: form });
      setMsg({ type: 'success', text: d.message });
      setForm({ faculty: '', date: '', timeSlot: '', reason: '' });
      loadMine();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <>
      <PageHero icon="fa-calendar-check" title={t('slot.title')} sub={t('slot.sub')} />
      <div className="container py-4">
        <div className="panel">
          {!user ? (
            <div className="alert alert-info mb-0">{t('common.loginFirst')} <Link to="/login">{t('nav.login')}</Link></div>
          ) : (
            <form className="row g-3" onSubmit={submit}>
              <div className="col-md-6">
                <label className="form-label">{t('slot.faculty')}</label>
                <select className="form-select" value={form.faculty} onChange={set('faculty')} required>
                  <option value="">{t('slot.choose')}</option>
                  {faculty.map((f) => <option key={f._id} value={f.name}>{f.name} — {f.department}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">{t('slot.date')}</label>
                <input type="date" className="form-control" min={today()} value={form.date} onChange={set('date')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">{t('slot.time')}</label>
                <select className="form-select" value={form.timeSlot} onChange={set('timeSlot')} required>
                  <option value="">{t('slot.choose')}</option>
                  {timeSlots.map((s) => <option key={s} value={s} disabled={taken.includes(s)}>{s}{taken.includes(s) ? ` (${t('slot.taken')})` : ''}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">{t('slot.reason')}</label>
                <input className="form-control" value={form.reason} onChange={set('reason')} required />
              </div>
              <div className="col-12"><button className="btn btn-gold" type="submit">{t('slot.confirm')}</button></div>
            </form>
          )}
          <Alert msg={msg} />

          {user && (
            <>
              <hr />
              <h3 className="h5">{t('slot.mine')}</h3>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead><tr><th>{t('slot.faculty')}</th><th>{t('slot.date')}</th><th>{t('slot.time')}</th><th>{t('slot.status')}</th></tr></thead>
                  <tbody>
                    {mine.length === 0 && <tr><td colSpan="4" className="text-muted">{t('common.none')}</td></tr>}
                    {mine.map((b) => (
                      <tr key={b._id}><td>{b.facultyName}</td><td>{b.date}</td><td>{b.timeSlot}</td><td><span className="badge text-bg-success">{b.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
