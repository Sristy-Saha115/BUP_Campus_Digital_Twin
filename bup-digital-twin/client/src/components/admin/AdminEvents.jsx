import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

const EMPTY = { clubName: '', title: '', date: '', venue: '', registrationUrl: '', details: '' };

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = useCallback(() => Promise.all([api('/admin/events'), api('/admin/clubs')])
    .then(([e, c]) => { setEvents(e.events); setClubs(c.clubs); })
    .catch((err) => setMsg({ type: 'danger', text: err.message })), []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/admin/events', { method: 'POST', body: form });
      setForm(EMPTY);
      setMsg({ type: 'success', text: 'Event added.' });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const remove = async (ev) => {
    if (!window.confirm(`Delete the event "${ev.title}"?`)) return;
    try {
      await api(`/admin/events/${ev.id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Event deleted.' });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <>
      <form className="row g-2 mb-4" onSubmit={submit}>
        <div className="col-md-4">
          <input className="form-control" list="admin-club-names" placeholder="Club name" value={form.clubName} onChange={set('clubName')} required />
          <datalist id="admin-club-names">{clubs.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        </div>
        <div className="col-md-8"><input className="form-control" placeholder="Event title" value={form.title} onChange={set('title')} required /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Date (e.g. 2026-11-20)" value={form.date} onChange={set('date')} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Venue" value={form.venue} onChange={set('venue')} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Registration link (https://...)" value={form.registrationUrl} onChange={set('registrationUrl')} /></div>
        <div className="col-12"><textarea className="form-control" rows="2" placeholder="Details" value={form.details} onChange={set('details')} /></div>
        <div className="col-12"><button className="btn btn-gold fw-bold">Add event</button></div>
      </form>
      <Alert msg={msg} />
      <div className="table-responsive mt-3">
        <table className="table table-hover align-middle">
          <thead><tr><th>Event</th><th>Club</th><th>Date / venue</th><th /></tr></thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.title}<div className="small text-muted">{ev.details}</div></td>
                <td>{ev.clubName}</td>
                <td>{ev.date || 'TBA'}<div className="small text-muted">{ev.venue}</div></td>
                <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => remove(ev)}>Delete</button></td>
              </tr>
            ))}
            {!events.length && <tr><td colSpan="4" className="text-muted">No events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
