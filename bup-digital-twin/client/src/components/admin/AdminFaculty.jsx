
import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

// Default Faculty Form
const EMPTY = {
  name: '',
  email: '',
  category: 'Regular',
  designation: '',
  department: 'ICT'
};

export default function AdminFaculty() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);

  // Update form fields
  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value
    }));
  };

  // Load Faculty Directory
  const load = useCallback(() => {
    return api('/admin/faculty')
      .then((data) => {
        // Sort faculty names alphabetically (A-Z)
        const sortedFaculty = [...data.faculty].sort((a, b) =>
          a.name.localeCompare(b.name, 'en', {
            sensitivity: 'base'
          })
        );

        setList(sortedFaculty);
      })
      .catch((err) => {
        setMsg({
          type: 'danger',
          text: err.message
        });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reset form
  const reset = () => {
    setForm({ ...EMPTY });
    setEditing(null);
  };

  // Add or Update Faculty
  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    try {
      if (editing) {
        await api(`/admin/faculty/${editing}`, {
          method: 'PATCH',
          body: form
        });
      } else {
        await api('/admin/faculty', {
          method: 'POST',
          body: form
        });
      }

      setMsg({
        type: 'success',
        text: editing
          ? 'Faculty member updated successfully.'
          : 'Faculty member added successfully.'
      });

      reset();
      await load();

    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message
      });
    }
  };

  // Edit Faculty
  const edit = (faculty) => {
    setEditing(faculty.id);

    setForm({
      name: faculty.name,
      email: faculty.email,
      category: faculty.category,
      designation: faculty.designation || '',
      department: faculty.department || ''
    });

    setMsg(null);
  };

  // Delete Faculty
  const remove = async (faculty) => {
    const confirmed = window.confirm(
      `Delete ${faculty.name} from the Faculty Directory?\n\n` +
      'Their login and availability will also be removed.'
    );

    if (!confirmed) return;

    setMsg(null);

    try {
      await api(`/admin/faculty/${faculty.id}`, {
        method: 'DELETE'
      });

      setMsg({
        type: 'success',
        text: 'Faculty member deleted successfully.'
      });

      if (editing === faculty.id) {
        reset();
      }

      await load();

    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message
      });
    }
  };

  return (
    <>
      {/* Faculty Add / Edit Form */}
      <form className="row g-2 mb-4" onSubmit={submit}>

        {/* Faculty Name */}
        <div className="col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="Faculty Name"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>

        {/* Faculty Email */}
        <div className="col-md-5">
          <input
            type="email"
            className="form-control"
            placeholder="Official Email"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        {/* Faculty Category */}
        <div className="col-md-2">
          <select
            className="form-select"
            value={form.category}
            onChange={set('category')}
          >
            <option value="Regular">Regular</option>
            <option value="Adjunct">Adjunct</option>
          </select>
        </div>

        {/* Faculty Designation */}
        <div className="col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="Designation"
            value={form.designation}
            onChange={set('designation')}
          />
        </div>

        {/* Faculty Department */}
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Department"
            value={form.department}
            onChange={set('department')}
          />
        </div>

        {/* Add / Save Buttons */}
        <div className="col-md-3 d-flex gap-2">
          <button
            type="submit"
            className="btn btn-gold fw-bold flex-fill"
          >
            {editing ? 'Save' : 'Add'}
          </button>

          {editing && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={reset}
            >
              Cancel
            </button>
          )}
        </div>

      </form>

      {/* Success / Error Messages */}
      <Alert msg={msg} />

      {/* Faculty Directory Table */}
      <div className="table-responsive mt-3">
        <table className="table table-hover align-middle">

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Account</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((faculty) => (
              <tr key={faculty.id}>

                {/* Faculty Information */}
                <td>
                  {faculty.name}
                  <div className="small text-muted">
                    {faculty.designation}
                  </div>
                </td>

                {/* Email */}
                <td>{faculty.email}</td>

                {/* Category */}
                <td>{faculty.category}</td>

                {/* Registration Status */}
                <td>
                  {faculty.hasAccount
                    ? 'Registered'
                    : 'Not registered'}
                </td>

                {/* Edit / Delete */}
                <td className="text-end text-nowrap">

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary me-1"
                    onClick={() => edit(faculty)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(faculty)}
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}

            {/* Empty Directory */}
            {list.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-muted text-center py-4"
                >
                  The Faculty Directory is empty.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </>
  );
}
