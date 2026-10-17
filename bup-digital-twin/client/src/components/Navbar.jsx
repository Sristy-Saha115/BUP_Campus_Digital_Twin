import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';

// Main bar items (always visible on desktop)
const MAIN = [
  ['/', 'nav.home'],
  ['/map', 'nav.map'],
  ['/bus', 'nav.bus'],
  ['/faculty', 'nav.faculty'],
  ['/search', 'nav.search'],
  ['/blood', 'nav.blood'],
];
// Items inside the "More" dropdown
const MORE = [
  ['/clubs', 'nav.clubs', 'fa-people-group'],
  ['/scholarships', 'nav.scholarships', 'fa-graduation-cap'],
  ['/chatbot', 'nav.chatbot', 'fa-robot'],
];

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);      // mobile menu
  const [more, setMore] = useState(false);      // dropdown
  const moreRef = useRef(null);
  const nav = useNavigate();
  const close = () => { setOpen(false); setMore(false); };

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMore(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark topbar sticky-top">
      <div className="container-fluid px-lg-4">
        <Link className="navbar-brand fw-bold" to="/" onClick={close}>
          <i className="fas fa-university text-warning me-2" />
          {t('brand')}
        </Link>
        <button className="navbar-toggler" type="button" aria-label="Menu" onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav mx-lg-auto align-items-lg-center">
            {MAIN.map(([to, key]) => (
              <li className="nav-item" key={to}>
                <NavLink end={to === '/'} className="nav-link" to={to} onClick={close}>{t(key)}</NavLink>
              </li>
            ))}
            <li className="nav-item dropdown" ref={moreRef}>
              <button type="button" className="nav-link dropdown-toggle btn btn-link" onClick={() => setMore(!more)}>
                {t('nav.more')}
              </button>
              <ul className={`dropdown-menu ${more ? 'show' : ''}`}>
                {MORE.map(([to, key, icon]) => (
                  <li key={to}>
                    <NavLink className="dropdown-item" to={to} onClick={close}>
                      <i className={`fa-solid ${icon} me-2 text-secondary`} />{t(key)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          {/* Right corner: language toggle + auth */}
          <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 ms-lg-auto">
            <div className="lang-toggle" role="group" aria-label="Language">
              <button className={lang === 'bn' ? 'active' : ''} onClick={() => setLang('bn')}>বাংলা</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
            </div>
            {user ? (
              <>
                <span className="text-white small d-none d-xl-inline">{user.name}</span>
                <button className="btn btn-light btn-sm rounded-pill fw-semibold" onClick={() => { logout(); close(); nav('/'); }}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link className="btn btn-light btn-sm rounded-pill fw-semibold px-3" to="/login" onClick={close}>{t('nav.login')}</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}