import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="container py-5 text-center">
      <h1 className="display-1 text-navy">404</h1>
      <p>{t('nf.title')}</p>
      <Link to="/" className="btn btn-gold">{t('nf.back')}</Link>
    </div>
  );
}
