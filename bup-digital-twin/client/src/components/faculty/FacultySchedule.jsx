import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { useLang } from '../../i18n.jsx';
import { api } from '../../api';
import { formatDateTime } from '../../dates';

export default function FacultySchedule() {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => (
    api('/slots/faculty/schedule').then(setData).catch((e) => setMsg({ type: 'danger', text: e.message }))
  ), []);
  useEffect(() => { load(); }, [load]);

  const complete = async (id) => {
    setMsg(null);
    try {
      await api(`/slots/${id}/complete`, { method: 'PATCH' });
      setMsg({ type: 'success', text: t('fd.completedMsg') });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  };

  if (!data) return msg ? <Alert msg={msg} /> : <p className="text-muted mb-0">{t('common.loading')}</p>;

  const table = (rows, emptyText, lastCol) => (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            <th>{t('slot.date')}</th><th>{t('slot.time')}</th><th>{t('fd.student')}</th>
            <th>{t('fd.reason')}</th><th>{lastCol.head}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="5" className="text-muted">{emptyText}</td></tr>}
          {rows.map((b) => (
            <tr key={b._id}>
              <td>
                {b.date}
                {b.date === data.today && <span className="badge text-bg-warning ms-2">{t('fs.today')}</span>}
              </td>
              <td>{b.timeSlot}</td>
              <td>
                <strong>{b.student?.name || '—'}</strong>
                <div className="small text-muted">{b.student?.email}</div>
              </td>
              <td>{b.reason}</td>
              <td className="text-nowrap">{lastCol.cell(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const markDone = {
    head: t('slot.actions'),
    cell: (b) => (b.date <= data.today
      ? <button className="btn btn-sm btn-navy" onClick={() => complete(b._id)}>{t('fd.complete')}</button>
      : <span className="text-muted small">—</span>),
  };

  return (
    <>
      <Alert msg={msg} />

      <h3 className="h5 mt-3">{t('fs.upcoming')} ({data.upcoming.length})</h3>
      {table(data.upcoming, t('fs.noneUpcoming'), markDone)}

      {data.awaiting.length > 0 && (
        <>
          <h3 className="h5 mt-4">{t('fs.awaiting')} ({data.awaiting.length})</h3>
          {table(data.awaiting, '', markDone)}
        </>
      )}

      <h3 className="h5 mt-4">{t('fs.completed')} ({data.completed.length})</h3>
      {table(data.completed, t('fs.noneCompleted'), { head: t('bd.completedOn'), cell: (b) => formatDateTime(b.completedAt, lang) })}
    </>
  );
}
