import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

const FILTERS = ['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status !== 'All') params.set('status', status);
    if (q.trim()) params.set('q', q.trim());
    return api(`/admin/bookings?${params}`)
      .then((d) => { setBookings(d.bookings); setCounts(d.counts); })
      .catch((e) => setMsg({ type: 'danger', text: e.message }));
  }, [status, q]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`btn btn-sm ${status === f ? 'btn-navy' : 'btn-outline-secondary'}`} onClick={() => setStatus(f)}>
            {f}{f !== 'All' && counts[f] !== undefined ? ` (${counts[f]})` : ''}
          </button>
        ))}
        <input className="form-control w-auto ms-auto" placeholder="Search student, faculty, date" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead><tr><th>Date / time</th><th>Student</th><th>Faculty</th><th>Reason</th><th>Status</th><th>History</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.date}<div className="small text-muted">{b.timeSlot}</div></td>
                <td>{b.studentName}<div className="small text-muted">{b.studentEmail}</div></td>
                <td>{b.facultyName}</td>
                <td>{b.reason}</td>
                <td>{b.status}{b.cancelReason && <div className="small text-muted">{b.cancelReason}</div>}</td>
                <td className="small">
                  {b.cancelledBy && <div>Cancelled by: {b.cancelledBy}</div>}
                  {b.cancelledAt && <div>Cancelled on: {new Date(b.cancelledAt).toLocaleString()}</div>}
                  {b.respondedAt && <div>Responded on: {new Date(b.respondedAt).toLocaleString()}</div>}
                  {b.completedAt && <div>Completed on: {new Date(b.completedAt).toLocaleString()}</div>}
                </td>
              </tr>
            ))}
            {!bookings.length && <tr><td colSpan="6" className="text-muted">No bookings found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Alert msg={msg} />
    </>
  );
}
