import { useLang } from '../i18n.jsx';

export default function Footer() {
  const { t } = useLang();
  return <footer className="footer">{t('footer')}</footer>;
}
