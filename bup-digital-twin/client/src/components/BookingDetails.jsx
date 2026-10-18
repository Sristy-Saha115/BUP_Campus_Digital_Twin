import { Fragment } from 'react';
import { useLang } from '../i18n.jsx';
import { formatDateTime } from '../dates';

// Full details of one booking, including cancellation reason and time.
// viewer: 'faculty' shows the student; 'student' shows the faculty member.
export default function BookingDetails({ booking: b, viewer }) {
  const { t, lang } = useLang();
  const when = (v) => formatDateTime(v, lang);

  const rows = [
    viewer === 'faculty'
      ? [t('fd.student'), `${b.student?.name || '—'}${b.student?.email ? ` (${b.student.email})` : ''}`]
      : [t('slot.faculty'), b.facultyName],
    [t('slot.date'), b.date],
    [t('slot.time'), b.timeSlot],
    [t('slot.reason'), b.reason],
    [t('slot.status'), t(`status.${b.status}`)],
    [t('bd.requestedOn'), when(b.createdAt)],
  ];
  if (b.status === 'Accepted' || b.status === 'Completed') rows.push([t('bd.acceptedOn'), when(b.respondedAt)]);
  if (b.status === 'Completed') rows.push([t('bd.completedOn'), when(b.completedAt)]);
  if (b.status === 'Cancelled') {
    rows.push(
      [t('bd.cancelledBy'), b.cancelledBy ? t(`role.${b.cancelledBy}`) : '—'],
      [t('bd.cancelReason'), b.cancelReason || t('bd.noReason')],
      [t('bd.cancelledOn'), when(b.cancelledAt || b.respondedAt || b.updatedAt)],
    );
  }

  return (
    <dl className="row mb-0 detail-list">
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt className="col-sm-4 col-md-3">{label}</dt>
          <dd className="col-sm-8 col-md-9 mb-2">{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
