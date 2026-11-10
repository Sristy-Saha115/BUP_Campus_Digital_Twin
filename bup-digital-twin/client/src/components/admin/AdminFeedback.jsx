
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';

const EMPTY_STATS = {
  total: 0,
  average: 0,
  newCount: 0
};

export default function AdminFeedback() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadFeedback = useCallback(async () => {
    try {
      const data = await api('/feedback');

      setReviews(data.feedback || []);
      setStats(data.stats || EMPTY_STATS);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const markReviewed = async (id) => {
    setBusyId(id);
    setError('');
    setSuccess('');

    try {
      await api(`/feedback/${id}/review`, {
        method: 'PATCH'
      });

      await loadFeedback();
      setSuccess('Feedback marked as reviewed.');
    } catch (err) {
      setError(err.message || 'Could not update feedback.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'all') return true;
    if (filter === 'new') return review.status === 'New';
    if (filter === 'reviewed') {
      return review.status === 'Reviewed';
    }

    return review.rating === Number(filter);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h2 className="h4 fw-bold mb-1">
            Campus Feedback
          </h2>

          <p className="text-muted mb-0">
            View and manage reviews submitted by campus visitors.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => {
            setLoading(true);
            loadFeedback();
          }}
        >
          <i className="fa-solid fa-rotate me-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="border rounded-3 p-3 h-100">
            <div className="small text-muted">
              Total Reviews
            </div>

            <div className="fs-3 fw-bold">
              {stats.total}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="border rounded-3 p-3 h-100">
            <div className="small text-muted">
              Average Rating
            </div>

            <div className="fs-3 fw-bold">
              <i
                className="fa-solid fa-star me-2"
                style={{ color: '#D9A000' }}
              />
              {stats.average}/5
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="border rounded-3 p-3 h-100">
            <div className="small text-muted">
              New Feedback
            </div>

            <div className="fs-3 fw-bold">
              {stats.newCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label
          htmlFor="feedback-filter"
          className="form-label fw-semibold"
        >
          Filter Reviews
        </label>

        <select
          id="feedback-filter"
          className="form-select"
          style={{ maxWidth: 260 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Reviews</option>
          <option value="new">New Feedback</option>
          <option value="reviewed">Reviewed</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {loading ? (
        <div className="text-muted py-4">
          Loading feedback...
        </div>
      ) : (
        <>
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="border rounded-3 p-3 mb-3"
            >
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <h3 className="h6 fw-bold mb-1">
                    {review.name || 'Anonymous'}
                  </h3>

                  <div className="small text-muted">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleString(
                          'en-GB',
                          { timeZone: 'Asia/Dhaka' }
                        )
                      : ''}
                  </div>
                </div>

                <div
                  aria-label={`${review.rating} out of 5 stars`}
                  style={{ fontSize: 20 }}
                >
                  <span style={{ color: '#D9A000' }}>
                    {'★'.repeat(review.rating)}
                  </span>

                  <span style={{ color: '#CBD5E1' }}>
                    {'★'.repeat(5 - review.rating)}
                  </span>
                </div>
              </div>

              <p
                className="my-3"
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere'
                }}
              >
                {review.comment}
              </p>

              <div className="d-flex align-items-center flex-wrap gap-2">
                <span
                  className={
                    review.status === 'Reviewed'
                      ? 'badge bg-success'
                      : 'badge bg-warning text-dark'
                  }
                >
                  {review.status}
                </span>

                {review.status === 'New' && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={busyId !== null}
                    onClick={() => markReviewed(review.id)}
                  >
                    {busyId === review.id
                      ? 'Updating...'
                      : 'Mark as Reviewed'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="border rounded-3 text-center text-muted p-4">
              No feedback found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
