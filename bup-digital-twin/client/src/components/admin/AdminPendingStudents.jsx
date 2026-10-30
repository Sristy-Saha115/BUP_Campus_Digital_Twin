import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

// STUDENT_APPROVAL_V1
export default function AdminPendingStudents() {
  const [students, setStudents] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    try {
      const result = await api('/admin/pending-students');
      setStudents(result.students);
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const review = async (student, status) => {
    const verb = status === 'Approved' ? 'Approve' : 'Reject';
    if (!window.confirm(`${verb} ${student.name} (${student.studentId || 'no ID'})? Verify their identity using an authorized BUP student record before approving.`)) return;
    setBusy(student.id);
    setMsg(null);
    try {
      await api(`/admin/students/${student.id}/approval`, {
        method: 'PATCH', body: { status }
      });
      setMsg({ type: 'success', text: `Student registration ${status.toLowerCase()}.` });
      await load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusy(null); }
  };

  return <>
    <p className="text-muted">Approve only after checking the Student ID against an independent, authorized student record. Email formatting alone does not establish identity.</p>
    <Alert msg={msg} />
    <div className="table-responsive"><table className="table table-hover align-middle">
      <thead><tr><th>Name</th><th>Student ID</th><th>BUP email</th><th>Registered</th><th>Actions</th></tr></thead>
      <tbody>
        {students.map((s) => <tr key={s.id}>
          <td>{s.name}</td><td>{s.studentId || 'Legacy account — verify'}</td>
          <td>{s.email}</td><td>{s.createdAt ? String(s.createdAt).slice(0, 10) : ''}</td>
          <td className="text-nowrap">
            <button type="button" disabled={!!busy} onClick={() => review(s, 'Approved')} className="btn btn-sm btn-success me-2">Approve</button>
            <button type="button" disabled={!!busy} onClick={() => review(s, 'Rejected')} className="btn btn-sm btn-outline-danger">Reject</button>
          </td>
        </tr>)}
        {!students.length && <tr><td colSpan="5" className="text-muted">No pending student registrations.</td></tr>}
      </tbody>
    </table></div>
  </>;
}
