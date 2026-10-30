import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

const EMPTY = { name: '', url: '', category: 'Club', description: '', icon: 'fa-people-group', order: 99 };

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = useCallback(() => api('/admin/clubs')
    .then((d) => setClubs(d.clubs))
    .catch((e) => setMsg({ type: 'danger', text: e.message })), []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/admin/clubs', { method: 'POST', body: form });
      setForm(EMPTY);
      setMsg({ type: 'success', text: 'Club added.' });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the club "${c.name}"? Events already posted for it will stay.`)) return;
    try {
      await api(`/admin/clubs/${c.id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Club deleted.' });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <>
      <form className="row g-2 mb-4" onSubmit={submit}>
        <div className="col-md-5"><input className="form-control" placeholder="Club name" value={form.name} onChange={set('name')} required /></div>
        <div className="col-md-7"><input className="form-control" placeholder="Facebook / website link (https://...)" value={form.url} onChange={set('url')} required /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Category" value={form.category} onChange={set('category')} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Icon (fa-people-group)" value={form.icon} onChange={set('icon')} /></div>
        <div className="col-md-2"><input type="number" min="0" max="999" className="form-control" placeholder="Order" value={form.order} onChange={set('order')} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Short description" value={form.description} onChange={set('description')} /></div>
        <div className="col-12"><button className="btn btn-gold fw-bold">Add club</button></div>
      </form>
      <Alert msg={msg} />
      <div className="table-responsive mt-3">
        <table className="table table-hover align-middle">
          <thead><tr><th>Club</th><th>Category</th><th>Link</th><th /></tr></thead>
          <tbody>
            {clubs.map((c) => (
              <tr key={c.id}>
                <td>{c.name}<div className="small text-muted">{c.description}</div></td>
                <td>{c.category}</td>
                <td><a href={c.url} target="_blank" rel="noreferrer noopener">Open</a></td>
                <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => remove(c)}>Delete</button></td>
              </tr>
            ))}
            {!clubs.length && <tr><td colSpan="4" className="text-muted">No clubs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
