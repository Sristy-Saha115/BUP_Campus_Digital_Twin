
import { useCallback, useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { api } from '../../api';

// Icon and order are handled automatically by the backend.
const EMPTY = {
  name: '',
  url: '',
  category: 'Club',
  description: ''
};

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((previous) => ({
      ...previous,
      [key]: e.target.value
    }));
  };

  // Load clubs
  const load = useCallback(async () => {
    try {
      const data = await api('/admin/clubs');
      setClubs(data.clubs || []);
    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Add a new club
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMsg(null);

    try {
      await api('/admin/clubs', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          url: form.url.trim(),
          category: form.category.trim() || 'Club',
          description: form.description.trim()
        }
      });

      setForm({ ...EMPTY });

      setMsg({
        type: 'success',
        text: 'Club added successfully.'
      });

      await load();
    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message
      });
    } finally {
      setBusy(false);
    }
  };

  // Delete an existing club
  const remove = async (club) => {
    const confirmed = window.confirm(
      `Delete the club "${club.name}"?\n\n` +
      'Events already posted for this club will remain.'
    );

    if (!confirmed) return;

    setMsg(null);

    try {
      await api(`/admin/clubs/${club.id}`, {
        method: 'DELETE'
      });

      setMsg({
        type: 'success',
        text: 'Club deleted successfully.'
      });

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
      <h2 className="h5 fw-bold mb-3">
        Manage Clubs
      </h2>

      <form
        className="row g-3 mb-4"
        onSubmit={submit}
      >
        {/* Club name */}
        <div className="col-md-5">
          <label
            htmlFor="admin-club-name"
            className="form-label"
          >
            Club Name
          </label>

          <input
            id="admin-club-name"
            type="text"
            className="form-control"
            placeholder="Enter club name"
            value={form.name}
            onChange={set('name')}
            maxLength={100}
            required
          />
        </div>

        {/* Website / Facebook URL */}
        <div className="col-md-7">
          <label
            htmlFor="admin-club-url"
            className="form-label"
          >
            Facebook / Website Link
          </label>

          <input
            id="admin-club-url"
            type="url"
            className="form-control"
            placeholder="https://..."
            value={form.url}
            onChange={set('url')}
            required
          />
        </div>

        {/* Category */}
        <div className="col-md-4">
          <label
            htmlFor="admin-club-category"
            className="form-label"
          >
            Category
          </label>

          <input
            id="admin-club-category"
            type="text"
            className="form-control"
            placeholder="e.g. Technology"
            value={form.category}
            onChange={set('category')}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="col-md-8">
          <label
            htmlFor="admin-club-description"
            className="form-label"
          >
            Short Description
          </label>

          <input
            id="admin-club-description"
            type="text"
            className="form-control"
            placeholder="Write a short description"
            value={form.description}
            onChange={set('description')}
            maxLength={500}
          />
        </div>

        {/* Submit */}
        <div className="col-12">
          <button
            type="submit"
            className="btn btn-gold fw-bold"
            disabled={busy}
          >
            {busy ? 'Adding...' : 'Add Club'}
          </button>
        </div>
      </form>

      <Alert msg={msg} />

      {/* Existing clubs */}
      <div className="table-responsive mt-3">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Club</th>
              <th>Category</th>
              <th>Link</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>

          <tbody>
            {clubs.map((club) => (
              <tr key={club.id}>
                <td>
                  <strong>{club.name}</strong>

                  {club.description && (
                    <div className="small text-muted">
                      {club.description}
                    </div>
                  )}
                </td>

                <td>{club.category}</td>

                <td>
                  <a
                    href={club.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                </td>

                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(club)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {clubs.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-muted"
                >
                  No clubs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
