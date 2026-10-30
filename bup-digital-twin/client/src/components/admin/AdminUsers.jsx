import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q.trim()) params.set('q', q.trim());
    return api(`/admin/users?${params}`)
      .then((d) => setUsers(d.users))
      .catch((e) => setMsg({ type: 'danger', text: e.message }));
  }, [role, q]);

  useEffect(() => { load(); }, [load]);

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? Their open bookings will be cancelled. This cannot be undone.`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'User deleted.' });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option>Student</option>
          <option>Faculty</option>
        </select>
        <input className="form-control w-auto" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.createdAt ? String(u.createdAt).slice(0, 10) : ''}</td>
                <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => remove(u)}>Delete</button></td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan="5" className="text-muted">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Alert msg={msg} />
    </>
  );
}
