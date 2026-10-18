import { useEffect, useState } from 'react';
import Alert from '../Alert.jsx';
import { useLang } from '../../i18n.jsx';
import { api } from '../../api';

// Only what the faculty dataset holds: name and email
export default function FacultyProfile() {
  const { t } = useLang();
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api('/slots/faculty/me').then((d) => setProfile(d.profile)).catch((e) => setMsg({ type: 'danger', text: e.message }));
  }, []);

  if (!profile) return msg ? <Alert msg={msg} /> : <p className="text-muted mb-0">{t('common.loading')}</p>;

  return (
    <>
      <dl className="row mb-3 detail-list">
        <dt className="col-sm-3">{t('slot.name')}</dt>
        <dd className="col-sm-9">{profile.name}</dd>
        <dt className="col-sm-3">{t('slot.email')}</dt>
        <dd className="col-sm-9"><a href={`mailto:${profile.email}`}>{profile.email}</a></dd>
      </dl>
      <p className="small text-muted mb-0">{t('fp.note')}</p>
    </>
  );
}
