
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n.jsx';

// ==========================================
// DATE HELPERS
// ==========================================

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

function getDateParts(value) {
  const match = String(value || '').match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return {
      day: '--',
      month: '',
      year: ''
    };
  }

  const year = match[1];
  const month = Number(match[2]);
  const day = Number(match[3]);

  return {
    day,
    month: MONTHS[month - 1] || '',
    year
  };
}

function isVenueOnly(slug, name) {
  const value = `${slug || ''} ${name || ''}`
    .toLowerCase();

  return (
    value.includes('senate') ||
    value.includes('bijoy')
  );
}

// ==========================================
// NEWS CARD
// ==========================================

export default function NewsCard({
  n,
  facilityName
}) {
  const { t, lang } = useLang();

  const bn = lang === 'bn';

  const [expanded, setExpanded] = useState(false);

  const date = getDateParts(n.date);

  const type = ['news', 'event', 'notice'].includes(
    n.type
  )
    ? n.type
    : 'news';

  const typeLabel = {
    news: bn ? 'খবর' : 'News',
    event: bn ? 'অনুষ্ঠান' : 'Event',
    notice: bn ? 'নোটিশ' : 'Notice'
  }[type];

  const icon = {
    news: 'fa-newspaper',
    event: 'fa-calendar-days',
    notice: 'fa-file-lines'
  }[type];

  const typeStyle = {
    news: {
      background: '#e7f1ff',
      color: '#155e9b'
    },
    event: {
      background: '#fff3cd',
      color: '#946200'
    },
    notice: {
      background: '#edf0f4',
      color: '#475569'
    }
  }[type];

  const hasDetails = Boolean(
    n.summary ||
    n.eventDate ||
    n.venue ||
    facilityName
  );

  const relatedFacilityIsVenue = isVenueOnly(
    n.facilitySlug,
    facilityName
  );

  return (
    <article
      className="bg-white border rounded-3 p-3"
      style={{
        borderLeft:
          type === 'event'
            ? '4px solid #f5b400'
            : type === 'notice'
              ? '4px solid #94a3b8'
              : '4px solid #0d2b4b',

        boxShadow:
          '0 2px 10px rgba(13,43,75,.04)'
      }}
    >

      <div className="d-flex gap-3 align-items-start">

        {/* DATE */}

        <div
          className="rounded-3 flex-shrink-0 text-center px-2 py-2"
          style={{
            width: 74,
            minHeight: 72,
            background: '#f4f7fb',
            color: '#0d2b4b'
          }}
        >
          <strong
            className="d-block"
            style={{
              fontSize: 24,
              lineHeight: 1.3
            }}
          >
            {date.day}
          </strong>

          <span
            className="small text-muted"
            style={{ fontSize: 11 }}
          >
            {date.month}
            {' '}
            {date.year}
          </span>
        </div>

        {/* MAIN INFORMATION */}

        <div
          className="flex-grow-1"
          style={{ minWidth: 0 }}
        >

          {/* TYPE BADGE */}

          <span
            className="rounded-pill d-inline-flex align-items-center gap-2 px-3 py-1 mb-2"
            style={{
              ...typeStyle,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <i className={`fa-solid ${icon}`} />
            {typeLabel}
          </span>

          {/* TITLE */}

          <h3
            className="h6 fw-bold mb-2"
            style={{
              color: '#0d2b4b',
              lineHeight: 1.5
            }}
          >
            {n.title}
          </h3>

          {/* SHORT EVENT INFO */}

          {type === 'event' && (
            <div className="d-flex flex-wrap gap-3 mb-2">

              {n.eventDate && (
                <span className="small text-muted">
                  <i className="fa-regular fa-calendar me-1" />
                  {n.eventDate}
                </span>
              )}

              {n.venue && (
                <span className="small text-muted">
                  <i className="fa-solid fa-location-dot me-1" />
                  {n.venue}
                </span>
              )}

            </div>
          )}

          {/* DETAILS TOGGLE */}

          {hasDetails && (
            <button
              type="button"
              className="btn btn-sm btn-outline-navy mt-1"
              aria-expanded={expanded}
              onClick={() =>
                setExpanded((value) => !value)
              }
            >
              {expanded
                ? (bn ? 'বিস্তারিত বন্ধ' : 'Hide Details')
                : (bn ? 'বিস্তারিত দেখুন' : 'View Details')}

              <i
                className={`fa-solid ${
                  expanded
                    ? 'fa-chevron-up'
                    : 'fa-chevron-down'
                } ms-2`}
              />
            </button>
          )}

          {/* EXPANDED DETAILS */}

          {expanded && hasDetails && (
            <div className="border-top mt-3 pt-3">

              {n.summary && (
                <p
                  className="small mb-3"
                  style={{
                    lineHeight: 1.75
                  }}
                >
                  {n.summary}
                </p>
              )}

              {/* EVENT DAY */}

              {type === 'event' &&
                n.eventDate && (
                  <p className="small mb-2">
                    <i className="fa-regular fa-calendar me-2" />
                    <strong>
                      {bn
                        ? 'অনুষ্ঠানের তারিখ:'
                        : 'Event Date:'}
                    </strong>
                    {' '}
                    {n.eventDate}
                  </p>
                )}

              {/* VENUE */}

              {n.venue && (
                <p className="small mb-2">
                  <i className="fa-solid fa-location-dot me-2" />
                  <strong>
                    {bn ? 'স্থান:' : 'Venue:'}
                  </strong>
                  {' '}
                  {n.venue}
                </p>
              )}

              {/* RELATED FACILITY */}

              {n.facilitySlug &&
                facilityName &&
                !relatedFacilityIsVenue && (
                  <p className="small mb-2">

                    <i className="fa-solid fa-building me-2" />

                    <Link
                      to={
                        '/explorer?tab=facilities&facility=' +
                        encodeURIComponent(n.facilitySlug)
                      }
                      className="text-decoration-none"
                    >
                      {t('ex.related')}
                      {': '}
                      {facilityName}
                    </Link>

                  </p>
                )}

            </div>
          )}

          {/* OFFICIAL LINK */}

          {n.sourceUrl && (
            <a
              href={n.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-link text-decoration-none px-0 mt-2"
            >
              {bn
                ? 'অফিসিয়াল পেজ'
                : 'Official Page'}

              <i className="fa-solid fa-arrow-up-right-from-square ms-2" />
            </a>
          )}

        </div>
      </div>
    </article>
  );
}
