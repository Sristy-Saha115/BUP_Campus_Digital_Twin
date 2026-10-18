import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { HOME_VIDEO_ID } from '../config.js';

const FEATURES = [
  ['/map', 'nav.map', 'f.map', 'fa-map-location-dot'],
  ['/bus', 'nav.bus', 'f.bus', 'fa-bus'],
  ['/faculty', 'nav.faculty', 'f.faculty', 'fa-calendar-check'],
  ['/blood', 'nav.blood', 'f.blood', 'fa-droplet'],
  ['/clubs', 'nav.clubs', 'f.clubs', 'fa-people-group'],
  ['/scholarships', 'nav.scholarships', 'f.scholarships', 'fa-graduation-cap'],
  ['/chatbot', 'nav.chatbot', 'f.chatbot', 'fa-robot'],
];

export default function Home() {
  const { t, lang } = useLang();
  const playerRef = useRef(null);
  const [muted, setMuted] = useState(true);

  // Browsers only allow autoplay when muted, so the viewer clicks to turn sound on.
  const toggleSound = () => {
    const win = playerRef.current && playerRef.current.contentWindow;
    if (!win) return;
    const send = (func, args = []) =>
      win.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
    if (muted) {
      send('unMute');
      send('setVolume', [100]);
      send('playVideo');
    } else {
      send('mute');
    }
    setMuted(!muted);
  };

  return (
    <>
      <section className="hero">
        {/* Fallback photo always sits behind the video */}
        <div className="hero-bg" style={{ backgroundImage: 'url(/img/bup.jpg)' }} />
        {HOME_VIDEO_ID && (
          <div className="hero-video" aria-hidden="true">
            <iframe
              ref={playerRef}
              title="BUP background video"
              src={`https://www.youtube.com/embed/${HOME_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HOME_VIDEO_ID}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
              allow="autoplay; encrypted-media"
              tabIndex={-1}
            />
          </div>
        )}
        <div className="hero-overlay" />

        {HOME_VIDEO_ID && (
          <button
            type="button"
            className="btn btn-light rounded-pill fw-semibold shadow"
            style={{ position: 'absolute', right: 20, bottom: 20, zIndex: 5 }}
            onClick={toggleSound}
          >
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'} me-2`} />
            {muted
              ? (lang === 'bn' ? 'শব্দ চালু করুন' : 'Unmute')
              : (lang === 'bn' ? 'শব্দ বন্ধ করুন' : 'Mute')}
          </button>
        )}

        <div className="container hero-content text-center text-white">
          <h1 className="display-4 fw-bold mb-3">{t('home.title')}</h1>
          <p className="lead mx-auto mb-4" style={{ maxWidth: 780 }}>{t('home.subtitle')}</p>
          <a href="#features" className="btn btn-gold btn-lg fw-bold me-2">{t('home.explore')}</a>
          <Link to="/clubs" className="btn btn-outline-light btn-lg fw-bold">{t('home.clubs')}</Link>
        </div>
      </section>

      <section id="features" className="py-5 bg-light">
        <div className="container">
          <h2 className="fw-bold text-navy text-center mb-4">{t('home.features')}</h2>
          <div className="row g-4">
            {FEATURES.map(([to, title, desc, icon]) => (
              <div className="col-sm-6 col-lg-3" key={to}>
                <Link to={to} className="feature-card">
                  <div className="icon-wrapper"><i className={`fa-solid ${icon} fa-lg`} /></div>
                  <h5 className="fw-bold text-navy">{t(title)}</h5>
                  <p className="small text-muted mb-0">{t(desc)}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
