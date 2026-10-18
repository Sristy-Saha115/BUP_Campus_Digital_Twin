import { useState } from 'react';
import FacultyBookings from '../components/faculty/FacultyBookings.jsx';
import FacultyAvailability from '../components/faculty/FacultyAvailability.jsx';
import FacultySchedule from '../components/faculty/FacultySchedule.jsx';
import FacultyProfile from '../components/faculty/FacultyProfile.jsx';
import { useLang } from '../i18n.jsx';

const TABS = [
  { key: 'bookings', label: 'fd.tabBookings', icon: 'fa-inbox', Panel: FacultyBookings },
  { key: 'availability', label: 'fd.tabAvailability', icon: 'fa-calendar-plus', Panel: FacultyAvailability },
  { key: 'schedule', label: 'fd.tabSchedule', icon: 'fa-calendar-days', Panel: FacultySchedule },
  { key: 'profile', label: 'fd.tabProfile', icon: 'fa-id-card', Panel: FacultyProfile },
];

export default function FacultyDashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState('bookings');
  const { Panel } = TABS.find((x) => x.key === tab);

  return (
    <div className="panel">
      <ul className="nav fd-tabs mb-4" role="tablist">
        {TABS.map((x) => (
          <li className="nav-item" key={x.key} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              className={`nav-link ${tab === x.key ? 'active' : ''}`}
              onClick={() => setTab(x.key)}
            >
              <i className={`fa-solid ${x.icon} me-2`} />{t(x.label)}
            </button>
          </li>
        ))}
      </ul>
      <Panel />
    </div>
  );
}
