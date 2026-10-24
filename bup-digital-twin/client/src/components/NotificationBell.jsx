import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n.jsx';

export default function NotificationBell() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(() => {
    api('/notifications').then((d) => { setItems(d.notifications); setUnread(d.unread); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const markRead = async () => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    load();
  };

  return (
    <div className="position-relative" ref={ref}>
      <button type="button" className="btn btn-link text-white position-relative p-1" aria-label={t('bell.title')} onClick={() => setOpen(!open)}>
        <i className="fa-solid fa-bell fa-lg" />
        {unread > 0 && <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">{unread}</span>}
      </button>
      {open && (
        <div className="notif-menu shadow">
          <div className="d-flex align-items-center px-3 py-2 border-bottom">
            <strong className="me-auto">{t('bell.title')}</strong>
            {unread > 0 && <button className="btn btn-link btn-sm p-0" onClick={markRead}>{t('bell.markRead')}</button>}
          </div>
          {items.length === 0 && <div className="p-3 small text-muted">{t('bell.none')}</div>}
          {items.map((n) => (
            <Link key={n._id} to={n.link || '/'} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => setOpen(false)}>
              <div className="small">{n.message}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{new Date(n.createdAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
