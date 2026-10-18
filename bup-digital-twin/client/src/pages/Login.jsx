import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';

export default function Login() {
  const { t } = useLang();
  const { authenticate } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student', facultyId: '', code: '' });
  const [facultyList, setFacultyList] = useState([]);
  const [codeRequired, setCodeRequired] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Faculty who do not have an account yet
  useEffect(() => {
    if (mode === 'register' && form.role === 'Faculty') {
      api('/auth/faculty-options').then((d) => { setFacultyList(d.faculty); setCodeRequired(d.codeRequired); }).catch(() => {});
    }
  }, [mode, form.role]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try { await authenticate(mode, form); nav('/'); }
    catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

  const isFaculty = mode === 'register' && form.role === 'Faculty';

  return (
    <>
      <PageHero icon="fa-user-shield" title={mode === 'login' ? t('auth.login') : t('auth.register')} />
      <div className="container py-4" style={{ maxWidth: 480 }}>
        <div className="panel">
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label className="form-label">{t('auth.name')}</label>
                <input className="form-control mb-3" value={form.name} onChange={set('name')} required />
              </>
            )}
            <label className="form-label">{t('auth.email')}</label>
            <input type="email" className="form-control mb-3" value={form.email} onChange={set('email')} required />
            <label className="form-label">{t('auth.password')}</label>
            <input type="password" minLength={6} className="form-control mb-3" value={form.password} onChange={set('password')} required />
            {mode === 'register' && (
              <>
                <label className="form-label">{t('auth.role')}</label>
                <select className="form-select mb-3" value={form.role} onChange={set('role')}>
                  {['Student', 'Faculty', 'Staff', 'Visitor'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </>
            )}
            {isFaculty && (
              <>
                <label className="form-label">{t('auth.facultyProfile')}</label>
                <select className="form-select mb-3" value={form.facultyId} onChange={set('facultyId')} required>
                  <option value="">{t('fac.choose')}</option>
                  {facultyList.map((f) => <option key={f._id} value={f._id}>{f.name} ({String(f.department).split('—').pop().trim()})</option>)}
                </select>
                {codeRequired && (
                  <>
                    <label className="form-label">{t('auth.facultyCode')}</label>
                    <input className="form-control mb-3" value={form.code} onChange={set('code')} required />
                  </>
                )}
              </>
            )}
            <button className="btn btn-gold w-100 fw-bold">{mode === 'login' ? t('auth.login') : t('auth.register')}</button>
          </form>
          <Alert msg={msg} />
          <button className="btn btn-link mt-2 p-0" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(null); }}>
            {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
        </div>
      </div>
    </>
  );
}