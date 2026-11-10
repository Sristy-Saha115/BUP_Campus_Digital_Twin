
import { useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import { api } from '../api';

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    if (busy) return;

    setMessage(null);

    // Rating must be between 1 and 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMessage({
        type: 'danger',
        text: 'Please select a star rating.'
      });
      return;
    }

    const cleanName = name.trim();
    const cleanComment = comment.trim();

    // No minimum character requirement
    // A review such as "Good" is accepted
    if (!cleanComment) {
      setMessage({
        type: 'danger',
        text: 'Please write your feedback.'
      });
      return;
    }

    if (cleanComment.length > 1000) {
      setMessage({
        type: 'danger',
        text: 'Feedback cannot exceed 1000 characters.'
      });
      return;
    }

    if (cleanName.length > 80) {
      setMessage({
        type: 'danger',
        text: 'Name cannot exceed 80 characters.'
      });
      return;
    }

    setBusy(true);

    try {
      await api('/feedback', {
        method: 'POST',
        body: {
          name: cleanName,
          rating,
          comment: cleanComment,
          website
        }
      });

      setMessage({
        type: 'success',
        text: 'Thank you! Your feedback has been sent to Admin.'
      });

      // Reset form after successful submission
      setRating(0);
      setHover(0);
      setName('');
      setComment('');
      setWebsite('');
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message || 'Unable to submit feedback.'
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        icon="fa-star"
        title="Campus Feedback"
        sub="Share your experience and help improve BUP campus services."
      />

      <div
        className="container py-4"
        style={{ maxWidth: 760 }}
      >
        <div className="panel">
          <h2 className="h4 fw-bold mb-2">
            Your Feedback Matters
          </h2>

          <p className="text-muted mb-4">
            Rate your experience and share your suggestions.
            Your feedback will only be visible to the Admin team.
            No login is required.
          </p>

          {message && (
            <div
              className={`alert alert-${message.type} mb-3`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          <form onSubmit={submit} noValidate>

            {/* Overall Star Rating */}
            <div className="mb-4">
              <label className="form-label fw-semibold d-block">
                Overall Rating{' '}
                <span className="text-danger">*</span>
              </label>

              <div
                className="d-flex align-items-center flex-wrap gap-1"
                role="group"
                aria-label="Overall rating"
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hover || rating);

                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} out of 5`}
                      aria-pressed={rating === star}
                      className="btn border-0 p-1"
                      onClick={() => {
                        setRating(star);
                        setMessage(null);
                      }}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onFocus={() => setHover(star)}
                      onBlur={() => setHover(0)}
                      style={{
                        fontSize: '32px',
                        color: filled ? '#E4A600' : '#C5CFDB',
                        background: 'transparent',
                        boxShadow: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <i
                        className={
                          filled
                            ? 'fa-solid fa-star'
                            : 'fa-regular fa-star'
                        }
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}

                <span className="ms-2 text-muted">
                  {rating
                    ? `${rating} out of 5 stars`
                    : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Optional Name */}
            <div className="mb-3">
              <label
                htmlFor="feedback-name"
                className="form-label fw-semibold"
              >
                Your Name (Optional)
              </label>

              <input
                id="feedback-name"
                type="text"
                className="form-control"
                placeholder="Anonymous"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Written Feedback */}
            <div className="mb-3">
              <label
                htmlFor="feedback-comment"
                className="form-label fw-semibold"
              >
                Write Your Feedback{' '}
                <span className="text-danger">*</span>
              </label>

              <textarea
                id="feedback-comment"
                className="form-control"
                rows={5}
                placeholder="Write your feedback or suggestions..."
                value={comment}
                maxLength={1000}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  resize: 'vertical'
                }}
              />

              <div className="d-flex justify-content-between flex-wrap gap-2 mt-2">
                <small className="text-muted">
                  Write anything you want to share.
                </small>

                <small className="text-muted">
                  {comment.length}/1000 characters
                </small>
              </div>
            </div>

            {/* Hidden honeypot for basic spam protection */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-10000px'
              }}
            >
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="btn fw-bold"
              style={{
                backgroundColor: '#F4B400',
                border: '1px solid #F4B400',
                color: '#102B4C',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.7 : 1,
                boxShadow: '0 3px 8px rgba(0,0,0,0.08)'
              }}
            >
              {busy ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <i
                    className="fa-solid fa-paper-plane me-2"
                    aria-hidden="true"
                  />
                  Submit Feedback
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}
