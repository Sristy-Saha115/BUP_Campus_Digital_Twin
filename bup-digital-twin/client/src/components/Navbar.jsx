
import { useEffect, useRef, useState } from 'react';
import {
  NavLink,
  Link,
  useNavigate
} from 'react-router-dom';

import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import NotificationBell from './NotificationBell.jsx';

// ==========================================
// MAIN NAVIGATION
// ==========================================

const MAIN = [
  ['/', 'nav.home'],
  ['/map', 'nav.map'],
  ['/bus', 'nav.bus'],
  ['/faculty', 'nav.faculty'],
  ['/blood', 'nav.blood'],
  ['/scholarships', 'nav.scholarships'],
];

// ==========================================
// MORE DROPDOWN
// ==========================================

const MORE = [
  ['/clubs', 'nav.clubs', 'fa-people-group'],
  ['/explorer', 'nav.explorer', 'fa-compass'],
  ['/chatbot', 'nav.chatbot', 'fa-robot'],
  ['/feedback', 'nav.feedback', 'fa-star'],
];

// ==========================================
// NAVBAR COMPONENT
// ==========================================

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);

  const moreRef = useRef(null);
  const nav = useNavigate();

  // Close all navigation menus
  const close = () => {
    setOpen(false);
    setMore(false);
  };

  // Close More dropdown when clicking outside
  useEffect(() => {
    const onDown = (event) => {
      if (
        moreRef.current &&
        !moreRef.current.contains(event.target)
      ) {
        setMore(false);
      }
    };

    document.addEventListener('mousedown', onDown);

    return () => {
      document.removeEventListener('mousedown', onDown);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark topbar sticky-top">
      <div className="container-fluid px-lg-4">

        {/* ==================================
            BUP LOGO + BRAND
        ================================== */}

        <Link
          className="navbar-brand fw-bold d-inline-flex align-items-center gap-2"
          to="/"
          onClick={close}
          style={{ textDecoration: 'none' }}
        >
          <img
            src="/bup-logo.png"
            alt="BUP Official Logo"
            width="48"
            height="48"
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: 0,
              boxShadow: 'none',
              display: 'block',
              flexShrink: 0
            }}
          />

          <span className="text-nowrap">
            {t('brand')}
          </span>
        </Link>

        {/* ==================================
            MOBILE NAVIGATION TOGGLE
        ================================== */}

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* ==================================
            NAVIGATION LINKS
        ================================== */}

        <div
          className={`collapse navbar-collapse ${
            open ? 'show' : ''
          }`}
        >
          <ul className="navbar-nav mx-lg-auto align-items-lg-center">

            {/* Main navigation items */}
            {MAIN.map(([to, key]) => (
              <li className="nav-item" key={to}>
                <NavLink
                  end={to === '/'}
                  className="nav-link"
                  to={to}
                  onClick={close}
                >
                  {t(key)}
                </NavLink>
              </li>
            ))}

            {/* ==================================
                MORE DROPDOWN
            ================================== */}

            <li
              className="nav-item dropdown"
              ref={moreRef}
            >
              <button
                type="button"
                className="nav-link dropdown-toggle btn btn-link"
                aria-expanded={more}
                aria-haspopup="true"
                onClick={() => setMore((prev) => !prev)}
              >
                {t('nav.more')}
              </button>

              <ul
                className={`dropdown-menu ${
                  more ? 'show' : ''
                }`}
              >
                {MORE.map(([to, key, icon]) => (
                  <li key={to}>
                    <NavLink
                      className="dropdown-item"
                      to={to}
                      onClick={close}
                    >
                      <i
                        className={`fa-solid ${icon} me-2 text-secondary`}
                        aria-hidden="true"
                      />

                      {to === '/feedback'
                        ? (lang === 'bn' ? 'মতামত' : 'Feedback')
                        : t(key)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          {/* ==================================
              LANGUAGE + ACCOUNT CONTROLS
          ================================== */}

          <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 ms-lg-auto">

            {/* Language switching */}
            <div
              className="lang-toggle"
              role="group"
              aria-label="Language"
            >
              <button
                type="button"
                className={lang === 'bn' ? 'active' : ''}
                onClick={() => setLang('bn')}
              >
                বাংলা
              </button>

              <button
                type="button"
                className={lang === 'en' ? 'active' : ''}
                onClick={() => setLang('en')}
              >
                English
              </button>
            </div>

            {/* Authenticated user controls */}
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Admin Dashboard */}
                {user.role === 'Admin' && (
                  <Link
                    className="btn btn-outline-light btn-sm rounded-pill"
                    to="/admin"
                    onClick={close}
                  >
                    Admin
                  </Link>
                )}

                {/* User Name */}
                <span className="text-white small d-none d-xl-inline">
                  {user.name}
                </span>

                {/* Logout */}
                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-pill fw-semibold"
                  onClick={() => {
                    logout();
                    close();
                    nav('/');
                  }}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              /* Login */
              <Link
                className="btn btn-light btn-sm rounded-pill fw-semibold px-3"
                to="/login"
                onClick={close}
              >
                {t('nav.login')}
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
