import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { t } = useLang();
  const { authenticate } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try { await authenticate(mode, form); nav('/'); }
    catch (err) { setMsg({ type: 'danger', text: err.message }); }
  };

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
            <button className="btn btn-gold w-100 fw-bold">{mode === 'login' ? t('auth.login') : t('auth.register')}</button>
          </form>
          <Alert msg={msg} />
          <button className="btn btn-link mt-2 p-0" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
        </div>
      </div>
    </>
  );
}
