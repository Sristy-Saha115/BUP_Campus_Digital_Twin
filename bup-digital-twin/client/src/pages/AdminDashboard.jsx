import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';
import AdminUsers from '../components/admin/AdminUsers.jsx';
// STUDENT_APPROVAL_V1
import AdminPendingStudents from '../components/admin/AdminPendingStudents.jsx';
import AdminFaculty from '../components/admin/AdminFaculty.jsx';
import AdminBookings from '../components/admin/AdminBookings.jsx';
import AdminEvents from '../components/admin/AdminEvents.jsx';
import AdminClubs from '../components/admin/AdminClubs.jsx';
import AdminScholarships from '../components/admin/AdminScholarships.jsx';
import { api } from '../api';

function Overview() {
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api('/admin/stats')
      .then((d) => setStats(d.stats))
      .catch((err) => setMsg({ type: 'danger', text: err.message }));
  }, []);

  return (
    <>
      <Alert msg={msg} />
      {stats && (
        <ul className="list-group">
          <li className="list-group-item d-flex justify-content-between">Student accounts <strong>{stats.students}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Faculty accounts <strong>{stats.faculty}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Faculty in directory <strong>{stats.directory}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Consultation bookings <strong>{stats.bookings}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Pending requests <strong>{stats.pending}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Clubs <strong>{stats.clubs}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Events <strong>{stats.events}</strong></li>
          <li className="list-group-item d-flex justify-content-between">Scholarships <strong>{stats.scholarships}</strong></li>
        </ul>
      )}
    </>
  );
}

// To add a new admin section later: create a component and add one line here.
const TABS = [
  { key: 'overview', label: 'Overview', icon: 'fa-chart-simple', Panel: Overview },
  { key: 'users', label: 'Users', icon: 'fa-users', Panel: AdminUsers },
  { key: 'pendingStudents', label: 'Pending Students', icon: 'fa-user-check', Panel: AdminPendingStudents },
  { key: 'faculty', label: 'Faculty Directory', icon: 'fa-chalkboard-user', Panel: AdminFaculty },
  { key: 'events', label: 'Events', icon: 'fa-calendar-days', Panel: AdminEvents },
  { key: 'clubs', label: 'Clubs', icon: 'fa-people-group', Panel: AdminClubs },
  { key: 'scholarships', label: 'Scholarships', icon: 'fa-graduation-cap', Panel: AdminScholarships },
  { key: 'bookings', label: 'Bookings', icon: 'fa-calendar-check', Panel: AdminBookings },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const { Panel } = TABS.find((x) => x.key === tab);

  return (
    <>
      <PageHero icon="fa-user-shield" title="Admin Dashboard" sub="Manage users, the Faculty Directory, events, clubs, scholarships and bookings." />
      <div className="container py-4">
        <div className="panel">
          <ul className="nav fd-tabs mb-4" role="tablist">
            {TABS.map((x) => (
              <li className="nav-item" key={x.key} role="presentation">
                <button type="button" role="tab" aria-selected={tab === x.key}
                  className={`nav-link ${tab === x.key ? 'active' : ''}`} onClick={() => setTab(x.key)}>
                  <i className={`fa-solid ${x.icon} me-2`} />{x.label}
                </button>
              </li>
            ))}
          </ul>
          <Panel />
        </div>
      </div>
    </>
  );
}
