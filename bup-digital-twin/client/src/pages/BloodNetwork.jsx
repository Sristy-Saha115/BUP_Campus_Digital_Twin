import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';
import { BLOOD_VIDEO_ID, BLOOD_SITE_URL } from '../config.js';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const EMPTY_REQ = { patientName: '', bloodGroup: '', hospital: '', contactNumber: '', district: '' };
const EMPTY_DONOR = { name: '', bloodGroup: '', phone: '', batchDept: '', area: '', lastDonated: '', available: true };

export default function BloodNetwork() {
  const { t } = useLang();
  const { user } = useAuth();

  // ----- emergency requests -----
  const [form, setForm] = useState(EMPTY_REQ);
  const [reqs, setReqs] = useState([]);
  const [reqFilter, setReqFilter] = useState('');
  const [reqMsg, setReqMsg] = useState(null);

  const loadReqs = useCallback(() => {
    api(`/blood${reqFilter ? `?group=${encodeURIComponent(reqFilter)}` : ''}`).then((d) => setReqs(d.requests)).catch(() => {});
  }, [reqFilter, user]);
  useEffect(() => { loadReqs(); }, [loadReqs]);

  const setR = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submitReq = async (e) => {
    e.preventDefault();
    setReqMsg(null);
    try {
      const d = await api('/blood', { method: 'POST', body: form });
      setReqMsg({ type: 'success', text: d.message });
      setForm(EMPTY_REQ);
      loadReqs();
    } catch (err) { setReqMsg({ type: 'danger', text: err.message }); }
  };
  const fulfill = async (id) => {
    try { await api(`/blood/${id}/fulfill`, { method: 'PATCH' }); loadReqs(); }
    catch (err) { setReqMsg({ type: 'danger', text: err.message }); }
  };

  // ----- donors -----
  const [stats, setStats] = useState({});
  const [donors, setDonors] = useState([]);
  const [donorFilter, setDonorFilter] = useState('');
  const [profile, setProfile] = useState(EMPTY_DONOR);
  const [hasProfile, setHasProfile] = useState(false);
  const [donorMsg, setDonorMsg] = useState(null);

  const loadDonors = useCallback(() => {
    const q = donorFilter ? `?group=${encodeURIComponent(donorFilter)}` : '';
    // Logged in users get full details; everyone else gets the public view
    api(`/donors${user ? '' : '/public'}${q}`).then((d) => setDonors(d.donors)).catch(() => {});
    api('/donors/stats').then((d) => setStats(d.stats)).catch(() => {});
  }, [donorFilter, user]);
  useEffect(() => { loadDonors(); }, [loadDonors]);

  useEffect(() => {
    if (!user) { setHasProfile(false); setProfile(EMPTY_DONOR); return; }
    api('/donors/me').then((d) => {
      if (d.donor) {
        setHasProfile(true);
        setProfile({ ...EMPTY_DONOR, ...d.donor });
      } else {
        setHasProfile(false);
        setProfile({ ...EMPTY_DONOR, name: user.name });
      }
    }).catch(() => {});
  }, [user]);

  const setD = (k) => (e) => setProfile({ ...profile, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const saveProfile = async (e) => {
    e.preventDefault();
    setDonorMsg(null);
    try {
      const d = await api('/donors', { method: 'POST', body: profile });
      setDonorMsg({ type: 'success', text: d.message });
      setHasProfile(true);
      loadDonors();
    } catch (err) { setDonorMsg({ type: 'danger', text: err.message }); }
  };
  const removeProfile = async () => {
    try {
      await api('/donors/me', { method: 'DELETE' });
      setHasProfile(false);
      setProfile({ ...EMPTY_DONOR, name: user.name });
      setDonorMsg(null);
      loadDonors();
    } catch (err) { setDonorMsg({ type: 'danger', text: err.message }); }
  };

  return (
    <div className="blood-page">
      <div className="container py-4">
        {/* Emergency request form + awareness video */}
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="panel h-100">
              <h2 className="blood-title">{t('blood.title')}</h2>
              <form onSubmit={submitReq}>
                <label className="form-label">{t('blood.patient')}</label>
                <input className="form-control mb-3" value={form.patientName} onChange={setR('patientName')} />

                <label className="form-label">{t('blood.group')} *</label>
                <select className="form-select mb-3" value={form.bloodGroup} onChange={setR('bloodGroup')} required>
                  <option value="">{t('blood.select')}</option>
                  {GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>

                <label className="form-label">{t('blood.hospital')} *</label>
                <input className="form-control mb-3" value={form.hospital} onChange={setR('hospital')} required />

                <label className="form-label">{t('blood.phone')} *</label>
                <input className="form-control mb-3" type="tel" placeholder="01XXXXXXXXX" value={form.contactNumber} onChange={setR('contactNumber')} required />

                <label className="form-label">{t('blood.district')}</label>
                <input className="form-control mb-3" value={form.district} onChange={setR('district')} />

                <button className="btn btn-danger w-100 fw-bold" type="submit">
                  <i className="fa-solid fa-droplet me-2" />{t('blood.submit')}
                </button>
                <Alert msg={reqMsg} />
                <p className="small text-muted mt-3 mb-0">{t('blood.note')}</p>
              </form>
            </div>
          </div>

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

        {/* Recent requests */}
        <div className="d-flex flex-wrap align-items-center gap-3 mt-5 mb-3">
          <h2 className="blood-title mb-0 me-auto">{t('blood.recent')}</h2>
          <select className="form-select w-auto" value={reqFilter} onChange={(e) => setReqFilter(e.target.value)} aria-label={t('blood.filter')}>
            <option value="">{t('blood.all')}</option>
            {GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="row g-3">
          {reqs.length === 0 && <p className="text-muted">{t('common.none')}</p>}
          {reqs.map((r) => (
            <div className="col-md-6 col-lg-4" key={r._id}>
              <div className="panel blood-card">
                <span className="blood-type">{r.bloodGroup}</span>
                <div>
                  <strong>{r.patientName || '—'}</strong>
                  <div className="small text-muted"><i className="fa-solid fa-hospital me-1" />{r.hospital}{r.district ? `, ${r.district}` : ''}</div>
                  <div className="small text-muted">{t('blood.postedAt')}: {new Date(r.createdAt).toLocaleString()}</div>
                  {r.contactNumber ? (
                    <a className="btn btn-sm btn-outline-danger mt-2 me-2" href={`tel:${r.contactNumber}`}><i className="fa-solid fa-phone me-1" />{r.contactNumber}</a>
                  ) : (
                    <Link className="btn btn-sm btn-outline-secondary mt-2 me-2" to="/login"><i className="fa-solid fa-lock me-1" />{t('blood.phoneHidden')}</Link>
                  )}
                  {user && <button className="btn btn-sm btn-outline-success mt-2" onClick={() => fulfill(r._id)}>{t('blood.markDone')}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Donors */}
        <div className="d-flex flex-wrap align-items-center gap-3 mt-5 mb-2">
          <h2 className="blood-title mb-0 me-auto">{t('blood.donors')}</h2>
          <a className="btn btn-outline-navy btn-sm" href={BLOOD_SITE_URL} target="_blank" rel="noopener noreferrer">
            {t('blood.official')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" />
          </a>
        </div>
        <p className="text-muted">{t('blood.donorsSub')}</p>

        <div className="panel mb-3">
          <div className="small fw-semibold mb-2">{t('blood.statsTitle')}</div>
          <div className="d-flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <button type="button" key={g} className={`chip ${donorFilter === g ? 'active' : ''}`} onClick={() => setDonorFilter(donorFilter === g ? '' : g)}>
                {g} <span className="ms-1 opacity-75">({stats[g] || 0})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          {!user && <div className="alert alert-info py-2"><i className="fa-solid fa-lock me-2" />{t('blood.loginToView')} <Link to="/login">{t('nav.login')}</Link></div>}
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>{t('blood.donorName')}</th><th>{t('blood.group')}</th><th>{t('blood.donorArea')}</th>
                  <th>{t('blood.donorBatch')}</th><th>{t('blood.donorPhone')}</th><th>{t('blood.lastDonated')}</th><th />
                </tr>
              </thead>
              <tbody>
                {donors.length === 0 && <tr><td colSpan="7" className="text-muted">{t('common.none')}</td></tr>}
                {donors.map((d) => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td><span className="blood-type sm">{d.bloodGroup}</span></td>
                    <td>{d.area || '—'}</td>
                    <td>{user ? (d.batchDept || '—') : <span className="text-muted small">{t('blood.phoneHidden')}</span>}</td>
                    <td>{user ? <a href={`tel:${d.phone}`}>{d.phone}</a> : <span className="text-muted small"><i className="fa-solid fa-lock me-1" />{t('blood.phoneHidden')}</span>}</td>
                    <td>{user ? (d.lastDonated || '—') : <span className="text-muted small">{t('blood.phoneHidden')}</span>}</td>
                    <td><span className={`badge text-bg-${d.available ? 'success' : 'secondary'}`}>{d.available ? t('blood.yes') : t('blood.no')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Become a donor */}
        <div className="panel mt-4">
          <h2 className="h5 fw-bold text-navy">{hasProfile ? t('blood.myProfile') : t('blood.becomeDonor')}</h2>
          {!user ? (
            <div className="alert alert-info mb-0">{t('blood.fillFirst')} <Link to="/login">{t('nav.login')}</Link></div>
          ) : (
            <form className="row g-3" onSubmit={saveProfile}>
              <div className="col-md-4"><label className="form-label">{t('blood.donorName')}</label><input className="form-control" value={profile.name} onChange={setD('name')} required /></div>
              <div className="col-md-4">
                <label className="form-label">{t('blood.group')}</label>
                <select className="form-select" value={profile.bloodGroup} onChange={setD('bloodGroup')} required>
                  <option value="">{t('blood.select')}</option>
                  {GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-md-4"><label className="form-label">{t('blood.phone')}</label><input className="form-control" type="tel" placeholder="01XXXXXXXXX" value={profile.phone} onChange={setD('phone')} required /></div>
              <div className="col-md-4"><label className="form-label">{t('blood.donorBatch')}</label><input className="form-control" value={profile.batchDept} onChange={setD('batchDept')} /></div>
              <div className="col-md-4"><label className="form-label">{t('blood.donorArea')}</label><input className="form-control" value={profile.area} onChange={setD('area')} /></div>
              <div className="col-md-4"><label className="form-label">{t('blood.lastDonated')}</label><input className="form-control" type="date" value={profile.lastDonated} onChange={setD('lastDonated')} /></div>
              <div className="col-12">
                <div className="form-check mb-2">
                  <input className="form-check-input" id="avail" type="checkbox" checked={profile.available} onChange={setD('available')} />
                  <label className="form-check-label" htmlFor="avail">{t('blood.available')}</label>
                </div>
                <button className="btn btn-danger me-2" type="submit">{t('blood.saveProfile')}</button>
                {hasProfile && <button className="btn btn-outline-secondary" type="button" onClick={removeProfile}>{t('blood.removeProfile')}</button>}
              </div>
            </form>
          )}
          <Alert msg={donorMsg} />
        </div>
      </div>
    </div>
  );
}
