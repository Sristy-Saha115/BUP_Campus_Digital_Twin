import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';

const today = () => new Date().toISOString().slice(0, 10);
const BADGE = { Pending: 'warning text-dark', Confirmed: 'success', Declined: 'danger', Cancelled: 'danger', Withdrawn: 'secondary' };

function StatusBadge({ status, t }) {
  return <span className={`badge text-bg-${BADGE[status] || 'secondary'}`}>{t(`status.${status}`)}</span>;
}

/* ---------------- Faculty member view ---------------- */
function FacultyView({ t }) {
  const [rows, setRows] = useState([]);
  const [linked, setLinked] = useState(true);
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api('/slots/incoming').then((d) => { setRows(d.bookings); setLinked(!!d.faculty); }).catch((e) => setMsg({ type: 'danger', text: e.message }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const respond = async (id, action) => {
    setMsg(null);
    try {
      await api(`/slots/${id}/respond`, { method: 'PATCH', body: { action, note: notes[id] || '' } });
      setNotes((n) => ({ ...n, [id]: '' }));
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <div className="panel">
      <div className="alert alert-info py-2">{t('fac.facultyHello')}</div>
      {!linked && <div className="alert alert-warning">{t('fac.notLinked')}</div>}
      <h2 className="h5">{t('fac.incoming')}</h2>
      <Alert msg={msg} />
      <div className="table-responsive mt-2">
        <table className="table align-middle">
          <thead>
            <tr><th>{t('fac.student')}</th><th>{t('fac.date')}</th><th>{t('fac.time')}</th><th>{t('fac.reason')}</th><th>{t('fac.status')}</th><th style={{ minWidth: 260 }} /></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="6" className="text-muted">{t('fac.none')}</td></tr>}
            {rows.map((b) => (
              <tr key={b._id}>
                <td>{b.studentName || '—'}</td>
                <td>{b.date}</td>
                <td>{b.timeSlot}</td>
                <td>{b.reason}</td>
                <td><StatusBadge status={b.status} t={t} />{b.note && <div className="small text-muted mt-1">{b.note}</div>}</td>
                <td>
                  {b.active && (
                    <div className="d-flex flex-column gap-2">
                      <input className="form-control form-control-sm" placeholder={t('fac.notePh')} value={notes[b._id] || ''}
                             onChange={(e) => setNotes({ ...notes, [b._id]: e.target.value })} />
                      <div className="d-flex flex-wrap gap-2">
                        {b.status === 'Pending' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => respond(b._id, 'confirm')}>{t('fac.accept')}</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => respond(b._id, 'decline')}>{t('fac.decline')}</button>
                          </>
                        )}
                        {b.status === 'Confirmed' && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => respond(b._id, 'cancel')}>{t('fac.cancelBooking')}</button>
                        )}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Student / other users view ---------------- */
function StudentView({ t }) {
  const [faculty, setFaculty] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [taken, setTaken] = useState([]);
  const [mine, setMine] = useState([]);
  const [dept, setDept] = useState('');
  const [form, setForm] = useState({ facultyId: '', date: '', timeSlot: '', reason: '' });
  const [msg, setMsg] = useState(null);

  const loadMine = useCallback(() => {
    api('/slots/mine').then((d) => setMine(d.bookings)).catch(() => {});
  }, []);

  useEffect(() => {
    api('/slots/faculty').then((d) => { setFaculty(d.faculty); setTimeSlots(d.timeSlots); }).catch((e) => setMsg({ type: 'danger', text: e.message }));
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    if (!form.facultyId || !form.date) { setTaken([]); return; }
    api(`/slots/availability?facultyId=${form.facultyId}&date=${form.date}`).then((d) => setTaken(d.taken)).catch(() => {});
  }, [form.facultyId, form.date]);

  const depts = useMemo(() => [...new Set(faculty.map((f) => f.department))], [faculty]);
  const shown = dept ? faculty.filter((f) => f.department === dept) : faculty;

  const change = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    if (k === 'facultyId' || k === 'date') next.timeSlot = '';
    setForm(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const d = await api('/slots', { method: 'POST', body: form });
      setMsg({ type: 'success', text: d.message });
      setForm({ facultyId: '', date: '', timeSlot: '', reason: '' });
      loadMine();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const withdraw = async (id) => {
    try { await api(`/slots/${id}/withdraw`, { method: 'PATCH' }); loadMine(); }
    catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <div className="panel">
      <form className="row g-3" onSubmit={submit}>
        <div className="col-md-6">
          <label className="form-label">{t('fac.department')}</label>
          <select className="form-select" value={dept} onChange={(e) => { setDept(e.target.value); setForm({ ...form, facultyId: '', timeSlot: '' }); }}>
            <option value="">{t('fac.allDepts')}</option>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">{t('fac.faculty')}</label>
          <select className="form-select" value={form.facultyId} onChange={change('facultyId')} required>
            <option value="">{t('fac.choose')}</option>
            {shown.map((f) => <option key={f._id} value={f._id}>{f.name} — {f.designation}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">{t('fac.date')}</label>
          <input type="date" className="form-control" min={today()} value={form.date} onChange={change('date')} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">{t('fac.time')}</label>
          <select className="form-select" value={form.timeSlot} onChange={change('timeSlot')} required>
            <option value="">{t('fac.choose')}</option>
            {timeSlots.map((s) => <option key={s} value={s} disabled={taken.includes(s)}>{s}{taken.includes(s) ? ` (${t('fac.taken')})` : ''}</option>)}
          </select>
        </div>
        <div className="col-12">
          <label className="form-label">{t('fac.reason')}</label>
          <input className="form-control" value={form.reason} onChange={change('reason')} required />
        </div>
        <div className="col-12"><button className="btn btn-gold" type="submit">{t('fac.send')}</button></div>
      </form>
      <Alert msg={msg} />

      <hr />
      <h2 className="h5">{t('fac.mine')}</h2>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead><tr><th>{t('fac.faculty')}</th><th>{t('fac.date')}</th><th>{t('fac.time')}</th><th>{t('fac.status')}</th><th /></tr></thead>
          <tbody>
            {mine.length === 0 && <tr><td colSpan="5" className="text-muted">{t('fac.none')}</td></tr>}
            {mine.map((b) => (
              <tr key={b._id}>
                <td>{b.facultyName}</td>
                <td>{b.date}</td>
                <td>{b.timeSlot}</td>
                <td>
                  <StatusBadge status={b.status} t={t} />
                  {b.status === 'Pending' && <div className="small text-muted mt-1">{t('fac.pendingHint')}</div>}
                  {b.note && <div className="small mt-1"><strong>{t('fac.facultyNote')}:</strong> {b.note}</div>}
                </td>
                <td className="text-end">
                  {b.active && <button className="btn btn-sm btn-outline-secondary" onClick={() => withdraw(b._id)}>{t('fac.withdraw')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FacultySlots() {
  const { t } = useLang();
  const { user } = useAuth();
  return (
    <>
      <PageHero icon="fa-calendar-check" title={t('fac.title')} sub={t('fac.sub')} />
      <div className="container py-4">
        {!user ? (
          <div className="panel"><div className="alert alert-info mb-0">{t('fac.loginFirst')} <Link to="/login">{t('nav.login')}</Link></div></div>
        ) : user.role === 'Faculty' ? <FacultyView t={t} /> : <StudentView t={t} />}
      </div>
    </>
  );
}
