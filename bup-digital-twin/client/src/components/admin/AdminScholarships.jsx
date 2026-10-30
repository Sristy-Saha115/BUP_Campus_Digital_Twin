import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

const EMPTY = {
  category: 'International', title: '', provider: '', type: '', amount: '', country: '', countryCode: '',
  level: '', funding: '', minCgpa: '', deadline: '', deadlineNote: '', statusManual: 'Varies',
  eligibility: '', description: '', applyUrl: '', order: 99
};

export default function AdminScholarships() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = useCallback(() => api('/admin/scholarships')
    .then((d) => setList(d.scholarships))
    .catch((e) => setMsg({ type: 'danger', text: e.message })), []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/admin/scholarships', { method: 'POST', body: form });
      setForm(EMPTY);
      setMsg({ type: 'success', text: 'Scholarship added.' });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete the scholarship "${s.title}"?`)) return;
    try {
      await api(`/admin/scholarships/${s.id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Scholarship deleted.' });
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <>
      <form className="row g-2 mb-4" onSubmit={submit}>
        <div className="col-md-3">
          <select className="form-select" value={form.category} onChange={set('category')}>
            <option>International</option><option>BUP</option><option>Government</option><option>University</option>
          </select>
        </div>
        <div className="col-md-9"><input className="form-control" placeholder="Scholarship title" value={form.title} onChange={set('title')} required /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Provider" value={form.provider} onChange={set('provider')} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Type (e.g. Merit)" value={form.type} onChange={set('type')} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Amount" value={form.amount} onChange={set('amount')} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Country" value={form.country} onChange={set('country')} /></div>
        <div className="col-md-2"><input className="form-control" placeholder="Code (gb)" maxLength={3} value={form.countryCode} onChange={set('countryCode')} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Levels (Master's, PhD)" value={form.level} onChange={set('level')} /></div>
        <div className="col-md-3"><input type="number" step="0.01" min="0" max="4" className="form-control" placeholder={form.category === 'BUP' ? 'Min CGPA (required)' : 'Min CGPA'} value={form.minCgpa} onChange={set('minCgpa')} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="Funding" value={form.funding} onChange={set('funding')} /></div>
        <div className="col-md-3"><input type="date" className="form-control" value={form.deadline} onChange={set('deadline')} title="Deadline" /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Deadline note" value={form.deadlineNote} onChange={set('deadlineNote')} /></div>
        <div className="col-md-3">
          <select className="form-select" value={form.statusManual} onChange={set('statusManual')} title="Status used when there is no deadline">
            <option>Varies</option><option>Open</option><option>Closed</option><option>Upcoming</option>
          </select>
        </div>
        <div className="col-md-3"><input className="form-control" placeholder="Apply link (https://...)" value={form.applyUrl} onChange={set('applyUrl')} /></div>
        <div className="col-md-6"><textarea className="form-control" rows="2" placeholder="Eligibility (one per line)" value={form.eligibility} onChange={set('eligibility')} /></div>
        <div className="col-md-6"><textarea className="form-control" rows="2" placeholder="Description" value={form.description} onChange={set('description')} /></div>
        <div className="col-12"><button className="btn btn-gold fw-bold">Add scholarship</button></div>
      </form>
      <Alert msg={msg} />
      <div className="table-responsive mt-3">
        <table className="table table-hover align-middle">
          <thead><tr><th>Scholarship</th><th>Category</th><th>Deadline</th><th /></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>{s.title}<div className="small text-muted">{s.provider}</div></td>
                <td>{s.category}</td>
                <td>{s.deadline ? String(s.deadline).slice(0, 10) : s.statusManual}</td>
                <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => remove(s)}>Delete</button></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="4" className="text-muted">No scholarships yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
