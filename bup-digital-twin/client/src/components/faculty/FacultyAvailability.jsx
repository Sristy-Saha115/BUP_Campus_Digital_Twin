import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import StatusBadge from '../StatusBadge.jsx';
import { useLang } from '../../i18n.jsx';
import { api } from '../../api';
import { todayDhaka } from '../../dates';

export default function FacultyAvailability() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ date: '', slots: [] });
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => (
    api('/slots/availability/mine').then(setData).catch((e) => setMsg({ type: 'danger', text: e.message }))
  ), []);
  useEffect(() => { load(); }, [load]);

  const toggleSlot = (s) => setForm((f) => ({
    ...f, slots: f.slots.includes(s) ? f.slots.filter((x) => x !== s) : [...f.slots, s],
  }));

  const add = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.date || form.slots.length === 0) { setMsg({ type: 'danger', text: t('fa.pickSlots') }); return; }
    try {
      await api('/slots/availability', { method: 'POST', body: { date: form.date, timeSlots: form.slots } });
      setMsg({ type: 'success', text: t('fa.added') });
      setForm({ date: '', slots: [] });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const remove = async (id) => {
    setMsg(null);
    try {
      await api(`/slots/availability/${id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: t('fa.removed') });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  if (!data) return msg ? <Alert msg={msg} /> : <p className="text-muted mb-0">{t('common.loading')}</p>;

  return (
    <>
      <p className="text-muted">{t('fa.intro')}</p>
      <div className={`alert alert-${data.configured ? 'info' : 'warning'} py-2`}>
        {t(data.configured ? 'fa.configured' : 'fa.notConfigured')}
      </div>

      <form className="row g-3 mb-2" onSubmit={add}>
        <div className="col-md-4">
          <label className="form-label">{t('slot.date')}</label>
          <input type="date" className="form-control" min={todayDhaka()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="col-md-8">
          <label className="form-label d-block">{t('slot.time')}</label>
          {data.timeSlots.map((s, i) => (
            <div className="form-check form-check-inline" key={s}>
              <input className="form-check-input" type="checkbox" id={`avail-slot-${i}`} checked={form.slots.includes(s)} onChange={() => toggleSlot(s)} />
              <label className="form-check-label" htmlFor={`avail-slot-${i}`}>{s}</label>
            </div>
          ))}
        </div>
        <div className="col-12"><button className="btn btn-gold" type="submit">{t('fa.add')}</button></div>
      </form>

      <Alert msg={msg} />

      <h3 className="h5 mt-4">{t('fa.upcomingTitle')}</h3>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr><th>{t('slot.date')}</th><th>{t('slot.time')}</th><th>{t('slot.status')}</th><th>{t('slot.actions')}</th></tr>
          </thead>
          <tbody>
            {data.slots.length === 0 && <tr><td colSpan="4" className="text-muted">{t('fa.none')}</td></tr>}
            {data.slots.map((s) => (
              <tr key={s._id}>
                <td>{s.date}</td>
                <td>{s.timeSlot}</td>
                <td>{s.booking ? <StatusBadge status={s.booking} /> : <span className="badge text-bg-light border">{t('fa.open')}</span>}</td>
                <td>
                  <button className="btn btn-sm btn-outline-danger" disabled={Boolean(s.booking)} onClick={() => remove(s._id)}>{t('fa.remove')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small text-muted mb-0">{t('fa.removeNote')}</p>
    </>
  );
}
