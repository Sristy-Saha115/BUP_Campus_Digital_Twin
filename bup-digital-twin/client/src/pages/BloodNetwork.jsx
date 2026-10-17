import { useCallback, useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';
import { BLOOD_VIDEO_ID } from '../config.js';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const EMPTY = { patientName: '', bloodGroup: '', hospital: '', contactNumber: '', district: '' };

export default function BloodNetwork() {
  const { t } = useLang();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api(`/blood${filter ? `?group=${encodeURIComponent(filter)}` : ''}`).then((d) => setList(d.requests)).catch(() => {});
  }, [filter]);
  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const d = await api('/blood', { method: 'POST', body: form });
      setMsg({ type: 'success', text: d.message });
      setForm(EMPTY);
      load();
    } catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const fulfill = async (id) => {
    try { await api(`/blood/${id}/fulfill`, { method: 'PATCH' }); load(); }
    catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <div className="blood-page">
      <div className="container py-4">
        <div className="row g-4">
          {/* LEFT: request form */}
          <div className="col-lg-5">
            <div className="panel h-100">
              <h2 className="blood-title">{t('blood.title')}</h2>
              <form onSubmit={submit}>
                <label className="form-label">{t('blood.patient')}</label>
                <input className="form-control mb-3" value={form.patientName} onChange={set('patientName')} />

                <label className="form-label">{t('blood.group')} *</label>
                <select className="form-select mb-3" value={form.bloodGroup} onChange={set('bloodGroup')} required>
                  <option value="">{t('blood.select')}</option>
                  {GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>

                <label className="form-label">{t('blood.hospital')} *</label>
                <input className="form-control mb-3" value={form.hospital} onChange={set('hospital')} required />

                <label className="form-label">{t('blood.phone')} *</label>
                <input className="form-control mb-3" type="tel" placeholder="01XXXXXXXXX" value={form.contactNumber} onChange={set('contactNumber')} required />

                <label className="form-label">{t('blood.district')}</label>
                <input className="form-control mb-3" value={form.district} onChange={set('district')} />

                <button className="btn btn-danger w-100 fw-bold" type="submit">
                  <i className="fa-solid fa-droplet me-2" />{t('blood.submit')}
                </button>
                <Alert msg={msg} />
                <p className="small text-muted mt-3 mb-0">{t('blood.note')}</p>
              </form>
            </div>
          </div>

          {/* RIGHT: awareness video */}
          <div className="col-lg-7">
            <div className="panel h-100">
              <h2 className="blood-title">{t('blood.videoTitle')}</h2>
              <div className="ratio ratio-16x9 rounded overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${BLOOD_VIDEO_ID}?rel=0`}
                  title={t('blood.videoTitle')}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>

        {/* BELOW: recent requests */}
        <div className="d-flex flex-wrap align-items-center gap-3 mt-5 mb-3">
          <h2 className="blood-title mb-0 me-auto">{t('blood.recent')}</h2>
          <select className="form-select w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('blood.filter')}>
            <option value="">{t('blood.all')}</option>
            {GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="row g-3">
          {list.length === 0 && <p className="text-muted">{t('common.none')}</p>}
          {list.map((r) => (
            <div className="col-md-6 col-lg-4" key={r._id}>
              <div className="panel blood-card">
                <span className="blood-type">{r.bloodGroup}</span>
                <div>
                  <strong>{r.patientName || '—'}</strong>
                  <div className="small text-muted"><i className="fa-solid fa-hospital me-1" />{r.hospital}{r.district ? `, ${r.district}` : ''}</div>
                  <div className="small text-muted">{new Date(r.createdAt).toLocaleString()}</div>
                  <a className="btn btn-sm btn-outline-danger mt-2 me-2" href={`tel:${r.contactNumber}`}><i className="fa-solid fa-phone me-1" />{t('blood.call')}</a>
                  {user && <button className="btn btn-sm btn-outline-success mt-2" onClick={() => fulfill(r._id)}>{t('blood.markDone')}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}