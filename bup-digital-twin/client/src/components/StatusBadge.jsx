import { useLang } from '../i18n.jsx';

const BADGE = { Pending: 'text-bg-warning', Accepted: 'text-bg-success', Cancelled: 'text-bg-secondary', Completed: 'badge-navy' };

// Shows ONLY the current status of a booking
export default function StatusBadge({ status }) {
  const { t } = useLang();
  return <span className={`badge ${BADGE[status] || 'text-bg-secondary'}`}>{t(`status.${status}`)}</span>;
}

// "Cancelled by Student" / "Cancelled by Faculty" (empty for bookings that are not cancelled)
export function CancelledBy({ booking }) {
  const { t } = useLang();
  if (booking.status !== 'Cancelled' || !booking.cancelledBy) return null;
  return <span className="small text-muted">{t(booking.cancelledBy === 'Faculty' ? 'fd.byFaculty' : 'fd.byStudent')}</span>;
}
