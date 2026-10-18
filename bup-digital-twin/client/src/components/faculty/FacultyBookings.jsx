import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Alert from '../Alert.jsx';
import StatusBadge, { CancelledBy } from '../StatusBadge.jsx';
import BookingDetails from '../BookingDetails.jsx';
import CancelReasonForm from '../CancelReasonForm.jsx';
import { useLang } from '../../i18n.jsx';
import { api } from '../../api';
import { todayDhaka } from '../../dates';

const FILTERS = ['All', 'Pending', 'Accepted', 'Cancelled', 'Completed'];
const NO_COUNTS = { All: 0, Pending: 0, Accepted: 0, Cancelled: 0, Completed: 0 };

export default function FacultyBookings() {
  const { t } = useLang();
  const [info, setInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState(NO_COUNTS);
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(null);          // { id, kind: 'cancel' | 'details' }
  const [msg, setMsg] = useState(null);
  const latest = useRef(0);                         // ignore out-of-date responses

  const load = useCallback(() => {
    const n = ++latest.current;
    return api(`/slots/faculty/bookings?status=${filter}`)
      .then((d) => {
        if (n !== latest.current) return;
        setInfo(d.faculty);
        setBookings(d.bookings);
        setCounts({ ...NO_COUNTS, ...d.counts });
      })
      .catch((e) => { if (n === latest.current) setMsg({ type: 'danger', text: e.message }); });
  }, [filter]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);   // pick up new requests automatically
    return () => clearInterval(id);
  }, [load]);

  const toggle = (id, kind) => setOpen((o) => (o && o.id === id && o.kind === kind ? null : { id, kind }));

  const act = async (path, okKey) => {
    setMsg(null);
    try {
      await api(path, { method: 'PATCH' });
      setMsg({ type: 'success', text: t(okKey) });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  };

  const confirmCancel = async (id, reason) => {
    await api(`/slots/${id}/cancel`, { method: 'PATCH', body: { reason } });
    setMsg({ type: 'success', text: t('fd.cancelled') });
    setOpen(null);
    load();
  };

  const today = todayDhaka();

  return (
    <>
      {info && (
        <p className="mb-3">
          {t('fd.welcome')} <strong>{info.name}</strong> <span className="text-muted">({info.email})</span>
        </p>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        {FILTERS.map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-navy' : 'btn-outline-navy'}`} onClick={() => { setFilter(f); setOpen(null); }}>
            {f === 'All' ? t('fd.all') : t(`status.${f}`)} ({counts[f]})
          </button>
        ))}
      </div>

      <Alert msg={msg} />

      <div className="table-responsive mt-3">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>{t('slot.date')}</th><th>{t('slot.time')}</th><th>{t('fd.student')}</th>
              <th>{t('fd.reason')}</th><th>{t('slot.status')}</th><th>{t('slot.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="6" className="text-muted">{t('fd.none')}</td></tr>}
            {bookings.map((b) => {
              const live = b.status === 'Pending' || b.status === 'Accepted';
              const notPast = b.date >= today;
              const isOpen = open && open.id === b._id;
              return (
                <Fragment key={b._id}>
                  <tr>
                    <td>{b.date}</td>
                    <td>{b.timeSlot}</td>
                    <td>
                      <strong>{b.student?.name || '—'}</strong>
                      <div className="small text-muted">{b.student?.email}</div>
                    </td>
                    <td>{b.reason}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <CancelledBy booking={b} />
                        {b.status === 'Pending' && notPast && (
                          <button className="btn btn-sm btn-success" onClick={() => act(`/slots/${b._id}/accept`, 'fd.accepted')}>{t('fd.accept')}</button>
                        )}
                        {b.status === 'Accepted' && b.date <= today && (
                          <button className="btn btn-sm btn-navy" onClick={() => act(`/slots/${b._id}/complete`, 'fd.completedMsg')}>{t('fd.complete')}</button>
                        )}
                        {live && notPast && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => toggle(b._id, 'cancel')}>{t('fd.cancel')}</button>
                        )}
                        <button className="btn btn-sm btn-outline-navy" onClick={() => toggle(b._id, 'details')}>
                          {isOpen && open.kind === 'details' ? t('fd.hideDetails') : t('fd.viewDetails')}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="table-light">
                      <td colSpan="6">
                        {open.kind === 'cancel'
                          ? <CancelReasonForm label={t('fd.cancelReason')} onConfirm={(r) => confirmCancel(b._id, r)} onBack={() => setOpen(null)} />
                          : <BookingDetails booking={b} viewer="faculty" />}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
