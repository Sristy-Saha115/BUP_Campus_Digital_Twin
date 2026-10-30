import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { BUS_TRACKER_URL } from '../config.js';

export default function BusTracking() {
  const { t } = useLang();
  return (
    <>
      <PageHero icon="fa-bus" title={t('bus.title')} sub={t('bus.sub')} />
      <div className="container py-4">
        <div className="panel">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="small text-muted me-auto">{t('bus.note')}</span>
            <a className="btn btn-gold" href={BUS_TRACKER_URL} target="_blank" rel="noopener noreferrer">
              {t('bus.open')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" />
            </a>
          </div>
          <iframe title="BUP bus tracker" src={BUS_TRACKER_URL} className="tracker-frame" allow="geolocation" loading="lazy" />
        </div>
      </div>
    </>
  );
}
