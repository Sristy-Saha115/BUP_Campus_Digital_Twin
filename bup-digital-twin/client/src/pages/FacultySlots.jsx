import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import StatusBadge, { CancelledBy } from '../components/StatusBadge.jsx';
import BookingDetails from '../components/BookingDetails.jsx';
import CancelReasonForm from '../components/CancelReasonForm.jsx';
import FacultyDashboard from './FacultyDashboard.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';
import { todayDhaka } from '../dates';

const fill = (text, b) =>
  text.replace('{faculty}', b.facultyName).replace('{date}', b.date)
    .replace('{time}', b.timeSlot).replace('{reason}', b.cancelReason || '—');

export default function FacultySlots() {
  const { t } = useLang();
  const { user } = useAuth();
  const isFaculty = user?.role === 'Faculty';
  const [faculty, setFaculty] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [taken, setTaken] = useState([]);
  const [offered, setOffered] = useState(null);     // slots this faculty offers on the chosen date (null = not loaded)
  const [avail, setAvail] = useState({ restricted: false, dates: [] });
  const [mine, setMine] = useState([]);
  const [open, setOpen] = useState(null);           // { id, kind: 'cancel' | 'details' }
  const [form, setForm] = useState({ faculty: '', date: '', timeSlot: '', reason: '' });
  const [msg, setMsg] = useState(null);

  const loadMine = () => {
    if (user && !isFaculty) api('/slots/mine').then((d) => setMine(d.bookings)).catch(() => {});
  };

  useEffect(() => {
    api('/slots/faculty').then((d) => { setFaculty(d.faculty); setTimeSlots(d.timeSlots); }).catch((e) => setMsg({ type: 'danger', text: e.message }));
  }, []);
  useEffect(() => {
    loadMine();
    if (!user || isFaculty) return undefined;
    const id = setInterval(loadMine, 30000);   // student sees accept/cancel messages automatically
    return () => clearInterval(id);
  }, [user]);
  useEffect(() => {
    // dates this faculty member offers (only when they have set availability)
    if (!form.faculty) { setAvail({ restricted: false, dates: [] }); return undefined; }
    let live = true;
    api(`/slots/availability/dates?faculty=${encodeURIComponent(form.faculty)}`).then((d) => {
      if (!live) return;
      setAvail(d);
      setForm((f) => (d.restricted && f.date && !d.dates.includes(f.date) ? { ...f, date: '', timeSlot: '' } : f));
    }).catch(() => {});
    return () => { live = false; };
  }, [form.faculty]);
  useEffect(() => {
    setOffered(null);
    if (!form.faculty || !form.date) { setTaken([]); return undefined; }
    let live = true;
    api(`/slots/availability?faculty=${encodeURIComponent(form.faculty)}&date=${form.date}`).then((d) => {
      if (live) { setTaken(d.taken); setOffered(d.offered); }
    }).catch(() => {});
    return () => { live = false; };
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

  const toggle = (id, kind) => setOpen((o) => (o && o.id === id && o.kind === kind ? null : { id, kind }));

  const cancelMine = async (id, reason) => {
    await api(`/slots/${id}/cancel`, { method: 'PATCH', body: { reason } });
    setMsg({ type: 'success', text: t('slot.cancelled') });
    setOpen(null);
    loadMine();
  };

  const today = todayDhaka();
  const slotRank = (b) => timeSlots.indexOf(b.timeSlot);
  // current = still Pending/Accepted (soonest first); history = Cancelled/Completed (latest first)
  const current = mine
    .filter((b) => b.status === 'Pending' || b.status === 'Accepted')
    .sort((a, b) => a.date.localeCompare(b.date) || slotRank(a) - slotRank(b));
  const history = mine
    .filter((b) => b.status === 'Cancelled' || b.status === 'Completed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const regular = faculty.filter((f) => f.category === 'Regular');
  const adjunct = faculty.filter((f) => f.category === 'Adjunct');

  // Formal messages for the student: accepted bookings and bookings cancelled by faculty
  const notices = mine
    .filter((b) => b.status === 'Accepted' || (b.status === 'Cancelled' && b.cancelledBy === 'Faculty'))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const renderTable = (rows, isHistory) => (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr><th>{t('slot.faculty')}</th><th>{t('slot.date')}</th><th>{t('slot.time')}</th><th>{t('slot.status')}</th><th>{t('slot.actions')}</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="5" className="text-muted">{isHistory ? t('slot.historyNone') : t('common.none')}</td></tr>}
          {rows.map((b) => {
            const canCancel = (b.status === 'Pending' || b.status === 'Accepted') && b.date >= today;
            const isOpen = open && open.id === b._id;
            return (
              <Fragment key={b._id}>
                <tr>
                  <td>{b.facultyName}</td>
                  <td>{b.date}</td>
                  <td>{b.timeSlot}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <CancelledBy booking={b} />
                      {canCancel && <button className="btn btn-sm btn-outline-danger" onClick={() => toggle(b._id, 'cancel')}>{t('slot.cancel')}</button>}
                      <button className="btn btn-sm btn-outline-navy" onClick={() => toggle(b._id, 'details')}>
                        {isOpen && open.kind === 'details' ? t('fd.hideDetails') : t('fd.viewDetails')}
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="table-light">
                    <td colSpan="5">
                      {open.kind === 'cancel'
                        ? <CancelReasonForm label={t('slot.cancelReason')} onConfirm={(r) => cancelMine(b._id, r)} onBack={() => setOpen(null)} />
                        : <BookingDetails booking={b} viewer="student" />}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const slotOptions = offered ? timeSlots.filter((s) => offered.includes(s)) : timeSlots;

  return (
    <>
      <PageHero
        icon="fa-calendar-check"
        title={isFaculty ? t('fd.title') : t('slot.title')}
        sub={isFaculty ? t('fd.sub') : t('slot.sub')}
      />
      <div className="container py-4">
        {isFaculty ? (
          <FacultyDashboard />
        ) : (
          <div className="panel">
            {!user ? (
              <div className="alert alert-info mb-0">{t('common.loginFirst')} <Link to="/login">{t('nav.login')}</Link></div>
            ) : (
              <>
                {notices.length > 0 && (
                  <div className="mb-4">
                    <h3 className="h5">{t('slot.messages')}</h3>
                    {notices.map((b) => (
                      <div key={b._id} className={`alert alert-${b.status === 'Accepted' ? 'success' : 'warning'} py-2`}>
                        <strong>{t(`status.${b.status}`)}:</strong>{' '}
                        {fill(t(b.status === 'Accepted' ? 'slot.msgAccepted' : 'slot.msgCancelled'), b)}
                      </div>
                    ))}
                  </div>
                )}

                <form className="row g-3" onSubmit={submit}>
                  <div className="col-md-6">
                    <label className="form-label">{t('slot.faculty')}</label>
                    <select className="form-select" value={form.faculty} onChange={set('faculty')} required>
                      <option value="">{t('slot.choose')}</option>
                      <optgroup label={t('slot.regular')}>
                        {regular.map((f) => <option key={f._id} value={f.name}>{f.name}</option>)}
                      </optgroup>
                      <optgroup label={t('slot.adjunct')}>
                        {adjunct.map((f) => <option key={f._id} value={f.name}>{f.name}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t('slot.date')}</label>
                    {avail.restricted ? (
                      <select className="form-select" value={form.date} onChange={set('date')} required>
                        <option value="">{t('slot.choose')}</option>
                        {avail.dates.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <input type="date" className="form-control" min={today} value={form.date} onChange={set('date')} required />
                    )}
                    {avail.restricted && avail.dates.length === 0 && <div className="form-text text-danger">{t('slot.noAvailable')}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t('slot.time')}</label>
                    <select className="form-select" value={form.timeSlot} onChange={set('timeSlot')} required>
                      <option value="">{t('slot.choose')}</option>
                      {slotOptions.map((s) => <option key={s} value={s} disabled={taken.includes(s)}>{s}{taken.includes(s) ? ` (${t('slot.taken')})` : ''}</option>)}
                    </select>
                    {form.date && offered && slotOptions.length === 0 && <div className="form-text text-danger">{t('slot.noSlotsDate')}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t('slot.reason')}</label>
                    <input className="form-control" value={form.reason} onChange={set('reason')} required />
                  </div>
                  <div className="col-12"><button className="btn btn-gold" type="submit">{t('slot.confirm')}</button></div>
                </form>

                <Alert msg={msg} />

                <hr />
                <h3 className="h5">{t('slot.mine')}</h3>
                {renderTable(current, false)}

                <h3 className="h5 mt-4">{t('slot.history')}</h3>
                {renderTable(history, true)}
              </>
            )}
            {!user && <Alert msg={msg} />}
          </div>
        )}

        {/* Faculty directory (not shown in the faculty panel) */}
        {!isFaculty && (
        <div className="panel mt-4">
          <h2 className="h4 mb-0">{t('slot.directory')}</h2>
          <p className="text-muted mb-0">{t('slot.directorySub')}</p>
          {[['slot.regular', regular], ['slot.adjunct', adjunct]].map(([key, list]) => (
            <section key={key}>
              <h3 className="dir-heading">{t(key)}</h3>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr><th style={{ width: 70 }}>{t('slot.sl')}</th><th>{t('slot.name')}</th><th>{t('slot.email')}</th></tr>
                  </thead>
                  <tbody>
                    {list.map((f, i) => (
                      <tr key={f._id}>
                        <td>{i + 1}</td>
                        <td>{f.name}</td>
                        <td><a href={`mailto:${f.email}`}>{f.email}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
        )}
      </div>
    </>
  );
}
