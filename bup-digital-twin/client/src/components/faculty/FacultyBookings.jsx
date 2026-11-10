
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Alert from '../Alert.jsx';
import StatusBadge, { CancelledBy } from '../StatusBadge.jsx';
import BookingDetails from '../BookingDetails.jsx';
import CancelReasonForm from '../CancelReasonForm.jsx';
import { useLang } from '../../i18n.jsx';
import { api } from '../../api';
import { todayDhaka } from '../../dates';

const FILTERS = ['All', 'Pending', 'Accepted', 'Cancelled', 'Completed'];

const NO_COUNTS = {
  All: 0,
  Pending: 0,
  Accepted: 0,
  Cancelled: 0,
  Completed: 0
};

export default function FacultyBookings() {
  const { t } = useLang();

  const [info, setInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState(NO_COUNTS);
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState(null);

  const latest = useRef(0);

  // Load consultation bookings
  const load = useCallback(() => {
    const n = ++latest.current;

    return api(`/slots/faculty/bookings?status=${filter}`)
      .then((data) => {
        if (n !== latest.current) return;

        setInfo(data.faculty);
        setBookings(data.bookings);
        setCounts({
          ...NO_COUNTS,
          ...data.counts
        });
      })
      .catch((err) => {
        if (n === latest.current) {
          setMsg({
            type: 'danger',
            text: err.message
          });
        }
      });
  }, [filter]);

  // Refresh automatically every 30 seconds
  useEffect(() => {
    load();

    const interval = setInterval(load, 30000);

    return () => clearInterval(interval);
  }, [load]);

  // Open or close booking details/cancellation
  const toggle = (id, kind) => {
    setOpen((previous) =>
      previous &&
      previous.id === id &&
      previous.kind === kind
        ? null
        : { id, kind }
    );
  };

  // Accept or complete a booking
  const act = async (path, okKey) => {
    setMsg(null);

    try {
      await api(path, {
        method: 'PATCH'
      });

      setMsg({
        type: 'success',
        text: t(okKey)
      });

      load();
    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message
      });
    }
  };

  // Cancel a booking with a reason
  const confirmCancel = async (id, reason) => {
    try {
      await api(`/slots/${id}/cancel`, {
        method: 'PATCH',
        body: { reason }
      });

      setMsg({
        type: 'success',
        text: t('fd.cancelled')
      });

      setOpen(null);
      load();
    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message
      });

      throw err;
    }
  };

  const today = todayDhaka();

  return (
    <>
      {info && (
        <p className="mb-3">
          {t('fd.welcome')}{' '}
          <strong>{info.name}</strong>{' '}
          <span className="text-muted">
            ({info.email})
          </span>
        </p>
      )}

      {/* Booking status filters */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`btn btn-sm ${
              filter === item
                ? 'btn-navy'
                : 'btn-outline-navy'
            }`}
            onClick={() => {
              setFilter(item);
              setOpen(null);
            }}
          >
            {item === 'All'
              ? t('fd.all')
              : t(`status.${item}`)}
            {' '}({counts[item]})
          </button>
        ))}
      </div>

      <Alert msg={msg} />

      <div className="table-responsive mt-3">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>{t('slot.date')}</th>
              <th>{t('slot.time')}</th>
              <th>{t('fd.student')}</th>
              <th>{t('fd.reason')}</th>
              <th>{t('slot.status')}</th>
              <th>{t('slot.actions')}</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="text-muted"
                >
                  {t('fd.none')}
                </td>
              </tr>
            )}

            {bookings.map((booking) => {
              const live =
                booking.status === 'Pending' ||
                booking.status === 'Accepted';

              const notPast = booking.date >= today;

              const isOpen =
                open && open.id === booking._id;

              return (
                <Fragment key={booking._id}>
                  <tr>
                    <td>{booking.date}</td>
                    <td>{booking.timeSlot}</td>

                    <td>
                      <strong>
                        {booking.student?.name || '—'}
                      </strong>

                      <div className="small text-muted">
                        {booking.student?.email}
                      </div>
                    </td>

                    <td>{booking.reason}</td>

                    <td>
                      <StatusBadge status={booking.status} />
                    </td>

                    <td>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <CancelledBy booking={booking} />

                        {/* Accept only current/future pending bookings */}
                        {booking.status === 'Pending' && notPast && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() =>
                              act(
                                `/slots/${booking._id}/accept`,
                                'fd.accepted'
                              )
                            }
                          >
                            {t('fd.accept')}
                          </button>
                        )}

                        {/* Complete accepted consultations */}
                        {booking.status === 'Accepted' &&
                          booking.date <= today && (
                            <button
                              type="button"
                              className="btn btn-sm btn-navy"
                              onClick={() =>
                                act(
                                  `/slots/${booking._id}/complete`,
                                  'fd.completedMsg'
                                )
                              }
                            >
                              {t('fd.complete')}
                            </button>
                          )}

                        {/*
                          FIX:
                          Allow cancellation of Pending/Accepted
                          bookings even when their date has passed.
                        */}
                        {live && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              toggle(booking._id, 'cancel')
                            }
                          >
                            {t('fd.cancel')}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-navy"
                          onClick={() =>
                            toggle(booking._id, 'details')
                          }
                        >
                          {isOpen && open.kind === 'details'
                            ? t('fd.hideDetails')
                            : t('fd.viewDetails')}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="table-light">
                      <td colSpan="6">
                        {open.kind === 'cancel' ? (
                          <CancelReasonForm
                            label={t('fd.cancelReason')}
                            onConfirm={(reason) =>
                              confirmCancel(booking._id, reason)
                            }
                            onBack={() => setOpen(null)}
                          />
                        ) : (
                          <BookingDetails
                            booking={booking}
                            viewer="faculty"
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
