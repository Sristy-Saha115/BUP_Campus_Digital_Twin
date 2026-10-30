import { useLang } from '../../i18n.jsx';

// Small pill that says how well a facility's position is known.
//   verified  -> pin on the map (coordinates confirmed)
//   text-only -> website describes the place in words, no confirmed coordinates
//   none      -> website says nothing about where it is
export default function MapBadge({ status }) {
  const { t } = useLang();
  if (status === 'verified') return <span className="pill pill-green"><i className="fa-solid fa-location-dot me-1" />{t('ex.map.verified')}</span>;
  if (status === 'text-only') return <span className="pill pill-gold"><i className="fa-solid fa-circle-info me-1" />{t('ex.map.textOnly')}</span>;
  return <span className="pill ex-pill-none"><i className="fa-regular fa-circle-question me-1" />{t('ex.map.none')}</span>;
}
