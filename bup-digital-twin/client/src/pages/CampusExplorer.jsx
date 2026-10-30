
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import PageHero from '../components/PageHero.jsx';
import NewsCard from '../components/explorer/NewsCard.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';

import '../explorer.css';

// ==========================================
// CONFIGURATION
// ==========================================

const PAGE_SIZE = 6;

const HIDDEN_VENUES = [
  'senate-hall',
  'bijoy-auditorium'
];

const CAFE_DETAILS = {
  vista: {
    en:
      'Vista is a BUP campus cafeteria serving ' +
      'traditional food, fast food and snacks. ' +
      'It has indoor seating and an outdoor ' +
      'seating area with a lake view.',
    bn:
      'Vista BUP-এর একটি ক্যাফেটেরিয়া। এখানে ' +
      'দেশীয় খাবার, ফাস্ট ফুড ও স্ন্যাকস পাওয়া যায়। ' +
      'ইনডোর ও লেকের পাশে আউটডোর বসার ব্যবস্থা রয়েছে.',
    location: 'Academic Building, Ground Floor',
    features: [
      'Traditional food',
      'Fast food and snacks',
      'Indoor seating',
      'Outdoor lake-view seating'
    ],
    hours: '7:30 AM – 8:00 PM',
    source:
      'https://www.bup.edu.bd/campus-life'
  },

  amitie: {
    en:
      'Amitie (Friendship) is a cafeteria located ' +
      'on the ground floor of the Faculty of ' +
      'Business Studies building.',
    bn:
      'Amitie (Friendship) ক্যাফেটেরিয়া BUP-এর ' +
      'Faculty of Business Studies ভবনের নিচতলায় অবস্থিত।',
    location: 'FBS Building, Ground Floor',
    features: [],
    source:
      'https://www.bup.edu.bd/office/office_details/36'
  },

  third: {
    en:
      'Third Place is one of the cafeterias ' +
      'at Bangladesh University of Professionals.',
    bn:
      'Third Place বাংলাদেশ ইউনিভার্সিটি অব ' +
      'প্রফেশনালস-এর একটি ক্যাফেটেরিয়া।',
    location: '',
    features: [],
    source:
      'https://www.bup.edu.bd/office/office_details/36'
  }
};

// ==========================================
// HELPERS
// ==========================================

const norm = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

function matches(text, query) {
  const haystack = norm(text);

  return norm(query)
    .split(' ')
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function isHiddenVenue(facility) {
  const slug = norm(facility.slug);
  const name = norm(facility.name);

  return (
    HIDDEN_VENUES.includes(slug) ||
    name === 'senate hall' ||
    name === 'bijoy auditorium'
  );
}

function getCafeDetails(facility) {
  const name = norm(facility.name);
  const slug = norm(facility.slug);

  if (slug.includes('vista') || name.includes('vista')) {
    return CAFE_DETAILS.vista;
  }

  if (
    slug.includes('amitie') ||
    name.includes('amitie') ||
    name.includes('friendship')
  ) {
    return CAFE_DETAILS.amitie;
  }

  if (
    slug.includes('third-place') ||
    name.includes('third place')
  ) {
    return CAFE_DETAILS.third;
  }

  return null;
}

function getSafeSummary(facility) {
  const cafe = getCafeDetails(facility);

  if (cafe) {
    return cafe.en;
  }

  // Keep the actual description while removing
  // unnecessary missing-information statements.
  return String(facility.summary || '')
    .replace(
      /\s*No building or capacity is published\.?/gi,
      ''
    )
    .replace(
      /\s*No building or floor is published\.?/gi,
      ''
    )
    .trim();
}

function formatDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return '';
  }

  const [year, month, day] = date.split('-');

  const names = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthIndex = Number(month) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    return '';
  }

  return `${Number(day)} ${names[monthIndex]} ${year}`;
}

// ==========================================
// DATA LOADER
// ==========================================

function useExplorerData(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    api(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.message || 'Unable to load information.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, revision]);

  return {
    data,
    loading,
    error,
    retry: () => setRevision((v) => v + 1)
  };
}

function Loading({ bn }) {
  return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-spinner fa-spin me-2" />
      {bn ? 'তথ্য লোড হচ্ছে...' : 'Loading information...'}
    </div>
  );
}

function ErrorBox({ message, retry, bn }) {
  return (
    <div className="alert alert-danger">
      {message}

      <button
        type="button"
        className="btn btn-sm btn-outline-danger ms-2"
        onClick={retry}
      >
        {bn ? 'আবার চেষ্টা করুন' : 'Retry'}
      </button>
    </div>
  );
}

// ==========================================
// FACILITY DETAILS
// ==========================================

function FacilityDetails({ facility, bn }) {
  const cafe = getCafeDetails(facility);

  const highlights = cafe
    ? cafe.features
    : Array.isArray(facility.highlights)
      ? facility.highlights
      : [];

  const location = cafe
    ? cafe.location
    : facility.location?.text;

  const phone = cafe
    ? null
    : facility.phone;

  const hours = cafe
    ? cafe.hours
    : facility.hours;

  const source = cafe?.source || facility.sourceUrl;

  return (
    <div className="border-top mt-3 pt-3">

      {/* CAFE DESCRIPTION */}

      {cafe && (
        <p
          className="small mb-3"
          style={{ lineHeight: 1.8 }}
        >
          {bn ? cafe.bn : cafe.en}
        </p>
      )}

      {/* SERVICES */}

      {highlights.length > 0 && (
        <div className="mb-3">

          <h6 className="fw-bold mb-2">
            <i className="fa-solid fa-list-check me-2" />
            {bn
              ? cafe ? 'খাবার ও সুবিধা' : 'সেবা ও সুবিধা'
              : cafe ? 'Food & Facilities' : 'Services & Facilities'}
          </h6>

          <ul className="ps-3 small mb-0">
            {highlights.map((item, index) => (
              <li key={index} className="mb-1">
                {item}
              </li>
            ))}
          </ul>

        </div>
      )}

      {/* LOCATION */}

      {location && (
        <p className="small mb-3">
          <i className="fa-solid fa-location-dot me-2" />
          <strong>{bn ? 'অবস্থান:' : 'Location:'}</strong>
          {' '}
          {location}
        </p>
      )}

      {/* PHONE */}

      {phone && (
        <p className="small mb-3">
          <i className="fa-solid fa-phone me-2" />
          <strong>{bn ? 'ফোন:' : 'Phone:'}</strong>
          {' '}
          <a
            href={`tel:${String(phone).replace(/[^\d+]/g, '')}`}
          >
            {phone}
          </a>
        </p>
      )}

      {/* CAFE HOURS */}

      {cafe && hours && (
        <p className="small mb-3">
          <i className="fa-regular fa-clock me-2" />
          <strong>{bn ? 'সময়:' : 'Hours:'}</strong>
          {' '}
          {hours}
        </p>
      )}

      {/* OTHER FACILITY HOURS */}

      {!cafe &&
        hours &&
        Array.isArray(hours.header) &&
        Array.isArray(hours.rows) &&
        hours.rows.length > 0 && (
          <div className="mb-3">
            <h6 className="fw-bold">
              {bn ? 'সময়সূচি' : 'Opening Hours'}
            </h6>

            <div className="table-responsive">
              <table className="table table-sm small">

                <thead>
                  <tr>
                    {hours.header.map((cell, index) => (
                      <th key={index}>{cell}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {hours.rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {hours.note && (
              <p className="small text-muted">
                {hours.note}
              </p>
            )}
          </div>
        )}

      {/* LINKS */}

      <div className="d-flex flex-wrap gap-2">

        {facility.appLink?.to && (
          <Link
            to={facility.appLink.to}
            className="btn btn-sm btn-gold"
          >
            {facility.appLink.label}
            <i className="fa-solid fa-arrow-right ms-2" />
          </Link>
        )}

        {source && (
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-secondary"
          >
            {bn ? 'অফিসিয়াল পেজ' : 'Official Page'}
            <i className="fa-solid fa-arrow-up-right-from-square ms-2" />
          </a>
        )}

      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function CampusExplorer() {
  const { t, lang } = useLang();
  const bn = lang === 'bn';

  const label = (en, bangla) =>
    bn ? bangla : en;

  const [params, setParams] = useSearchParams();

  // Existing old map URLs will open Facilities.
  const tab =
    params.get('tab') === 'news'
      ? 'news'
      : 'facilities';

  const selectedSlug = params.get('facility') || '';

  const facilitiesRequest = useExplorerData(
    '/explorer/facilities'
  );

  const newsRequest = useExplorerData(
    '/explorer/news'
  );

  // Facilities
  const [facilitySearch, setFacilitySearch] =
    useState('');

  const [category, setCategory] = useState('');
  const [expandedSlug, setExpandedSlug] =
    useState('');

  // News & Events
  const [newsSearch, setNewsSearch] = useState('');
  const [newsType, setNewsType] = useState('');
  const [sortOrder, setSortOrder] =
    useState('newest');

  const [newsLimit, setNewsLimit] =
    useState(PAGE_SIZE);

  // ========================================
  // URL AND FILTER EFFECTS
  // ========================================

  useEffect(() => {
    setExpandedSlug(selectedSlug);
  }, [selectedSlug]);

  useEffect(() => {
    setNewsLimit(PAGE_SIZE);
  }, [newsSearch, newsType, sortOrder]);

  // ========================================
  // API DATA
  // ========================================

  const allFacilities =
    facilitiesRequest.data?.facilities || [];

  const allNews =
    newsRequest.data?.items || [];

  // Remove only the two selected venues
  // from the facility display.
  const facilities = useMemo(
    () => allFacilities.filter(
      (facility) => !isHiddenVenue(facility)
    ),
    [allFacilities]
  );

  // Derive category counts from visible facilities.
  // Backend counts still include the two venues.
  const categories = useMemo(() => {
    const original =
      facilitiesRequest.data?.categories || [];

    return original
      .map((categoryItem) => ({
        ...categoryItem,
        count: facilities.filter(
          (f) => f.category === categoryItem.key
        ).length
      }))
      .filter((item) => item.count > 0);
  }, [
    facilities,
    facilitiesRequest.data
  ]);

  const facilityNames = useMemo(
    () => Object.fromEntries(
      allFacilities.map((f) => [f.slug, f.name])
    ),
    [allFacilities]
  );

  const capturedAt =
    facilitiesRequest.data?.capturedAt ||
    newsRequest.data?.capturedAt ||
    '';

  // ========================================
  // FILTER FACILITIES
  // ========================================

  const visibleFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (category && f.category !== category) {
        return false;
      }

      const cafe = getCafeDetails(f);

      const searchable = [
        f.name,
        f.categoryLabel,
        getSafeSummary(f),
        f.location?.text,
        ...(f.highlights || []),
        cafe?.bn
      ].join(' ');

      return matches(searchable, facilitySearch);
    });
  }, [
    facilities,
    category,
    facilitySearch
  ]);

  // ========================================
  // FILTER & SORT NEWS
  // ========================================

  const visibleNews = useMemo(() => {
    const filtered = allNews.filter((item) => {
      if (newsType && item.type !== newsType) {
        return false;
      }

      const searchable = [
        item.title,
        item.summary,
        item.venue,
        item.eventDate,
        facilityNames[item.facilitySlug]
      ].join(' ');

      return matches(searchable, newsSearch);
    });

    // date is the source listing date (YYYY-MM-DD).
    // Keep original order for records with the
    // same date.
    return filtered
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const dateA = String(a.item.date || '');
        const dateB = String(b.item.date || '');

        const compared =
          sortOrder === 'oldest'
            ? dateA.localeCompare(dateB)
            : dateB.localeCompare(dateA);

        return compared || a.index - b.index;
      })
      .map(({ item }) => item);
  }, [
    allNews,
    newsType,
    newsSearch,
    sortOrder,
    facilityNames
  ]);

  // ========================================
  // ACTIONS
  // ========================================

  const chooseTab = (next) => {
    setParams({ tab: next });
  };

  const toggleDetails = (slug) => {
    const next =
      expandedSlug === slug ? '' : slug;

    setExpandedSlug(next);

    setParams(
      next
        ? { tab: 'facilities', facility: next }
        : { tab: 'facilities' },
      { replace: true }
    );
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <PageHero
        icon="fa-compass"
        title={label(
          'Explore BUP Campus',
          'বিইউপি ক্যাম্পাস পরিচিতি'
        )}
        sub={label(
          'Facilities, campus news and events',
          'ক্যাম্পাসের সুবিধা, খবর ও অনুষ্ঠান'
        )}
      />

      <div className="container py-4">

        {/* PAGE HEADER */}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">

          <div className="small text-muted">
            <i className="fa-solid fa-circle-info me-2" />
            {label(
              'Information from BUP official sources',
              'BUP-এর অফিসিয়াল সূত্রের তথ্য'
            )}

            {capturedAt && (
              <span> · {formatDate(capturedAt)}</span>
            )}
          </div>

          <Link
            to="/map"
            className="btn btn-sm btn-navy"
          >
            <i className="fa-solid fa-map-location-dot me-2" />
            {label('Campus Map', 'ক্যাম্পাস ম্যাপ')}
          </Link>
        </div>

        <div className="panel">

          {/* MAIN TABS */}

          <div
            className="d-flex flex-wrap gap-2 border-bottom pb-3 mb-4"
            role="tablist"
          >

            <button
              type="button"
              role="tab"
              aria-selected={tab === 'facilities'}
              className={`btn ${
                tab === 'facilities'
                  ? 'btn-navy'
                  : 'btn-outline-navy'
              }`}
              onClick={() => chooseTab('facilities')}
            >
              <i className="fa-solid fa-building-columns me-2" />
              {label('Campus Facilities', 'ক্যাম্পাস সুবিধা')}
              {' '}({facilities.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === 'news'}
              className={`btn ${
                tab === 'news'
                  ? 'btn-navy'
                  : 'btn-outline-navy'
              }`}
              onClick={() => chooseTab('news')}
            >
              <i className="fa-solid fa-newspaper me-2" />
              {label('News & Events', 'খবর ও অনুষ্ঠান')}
            </button>

          </div>

          {/* =================================
              FACILITIES TAB
              ================================= */}

          {tab === 'facilities' && (

            facilitiesRequest.loading ? (
              <Loading bn={bn} />
            ) : facilitiesRequest.error ? (
              <ErrorBox
                message={facilitiesRequest.error}
                retry={facilitiesRequest.retry}
                bn={bn}
              />
            ) : (
              <>
                {/* SEARCH + CATEGORY */}

                <div className="row g-2 mb-3">

                  <div className="col-12 col-md-8">
                    <input
                      type="search"
                      className="form-control"
                      aria-label="Search facilities"
                      value={facilitySearch}
                      onChange={(e) =>
                        setFacilitySearch(e.target.value)
                      }
                      placeholder={label(
                        'Search library, cafeteria, medical centre...',
                        'লাইব্রেরি, ক্যাফেটেরিয়া, মেডিকেল সেন্টার...'
                      )}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <select
                      className="form-select"
                      aria-label="Facility category"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value)
                      }
                    >
                      <option value="">
                        {label(
                          'All Categories',
                          'সব ক্যাটাগরি'
                        )}
                      </option>

                      {categories.map((item) => (
                        <option
                          key={item.key}
                          value={item.key}
                        >
                          {t(`ex.cat.${item.key}`)}
                          {' '}({item.count})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <p className="small text-muted mb-3">
                  {visibleFacilities.length}
                  {' '}
                  {label(
                    'facilities found',
                    'টি সুবিধা পাওয়া গেছে'
                  )}
                </p>

                {/* FACILITY CARDS */}

                {visibleFacilities.length === 0 ? (
                  <div className="alert alert-light border">
                    {label(
                      'No matching facilities.',
                      'কোনো সুবিধা পাওয়া যায়নি।'
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-link"
                      onClick={() => {
                        setFacilitySearch('');
                        setCategory('');
                      }}
                    >
                      {label(
                        'Clear Filters',
                        'ফিল্টার মুছুন'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="row g-3">

                    {visibleFacilities.map((f) => {
                      const cafe = getCafeDetails(f);
                      const opened =
                        expandedSlug === f.slug;

                      const description =
                        cafe
                          ? (
                              bn
                                ? 'BUP Campus Cafeteria'
                                : 'BUP Campus Cafeteria'
                            )
                          : getSafeSummary(f);

                      return (
                        <div
                          key={f.slug}
                          className="col-12 col-md-6 col-xl-4"
                        >
                          <article
                            className="h-100 bg-white border rounded-3 p-3 d-flex flex-column"
                            style={{
                              borderTop:
                                cafe
                                  ? '4px solid #f5b400'
                                  : '4px solid #0d2b4b',
                              boxShadow:
                                '0 3px 12px rgba(13,43,75,.05)'
                            }}
                          >

                            {/* HEADING */}

                            <div className="d-flex gap-3 align-items-start mb-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                  width: 44,
                                  height: 44,
                                  background: '#0d2b4b',
                                  color: '#ffc107'
                                }}
                              >
                                <i className={`fa-solid ${
                                  f.icon || 'fa-building'
                                }`} />
                              </div>

                              <div>
                                <h3 className="h6 fw-bold mb-1">
                                  {f.name}
                                </h3>

                                <span className="small text-muted">
                                  {t(`ex.cat.${f.category}`)}
                                </span>
                              </div>
                            </div>

                            <p
                              className="small text-secondary mb-3"
                              style={{
                                lineHeight: 1.65,
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 3,
                                overflow: 'hidden'
                              }}
                            >
                              {description}
                            </p>

                            {/* LOCATION */}

                            {(cafe?.location ||
                              f.location?.text) && (
                              <p className="small text-muted mb-3">
                                <i className="fa-solid fa-location-dot me-2" />
                                {cafe?.location ||
                                  f.location?.text}
                              </p>
                            )}

                            {/* DETAILS */}

                            <div className="mt-auto">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-navy"
                                aria-expanded={opened}
                                onClick={() =>
                                  toggleDetails(f.slug)
                                }
                              >
                                {opened
                                  ? label(
                                      'Hide Details',
                                      'বিস্তারিত বন্ধ'
                                    )
                                  : label(
                                      'View Details',
                                      'বিস্তারিত'
                                    )}

                                <i
                                  className={`fa-solid ${
                                    opened
                                      ? 'fa-chevron-up'
                                      : 'fa-chevron-down'
                                  } ms-2`}
                                />
                              </button>
                            </div>

                            {opened && (
                              <FacilityDetails
                                facility={f}
                                bn={bn}
                              />
                            )}

                          </article>
                        </div>
                      );
                    })}

                  </div>
                )}
              </>
            )
          )}

          {/* =================================
              NEWS & EVENTS TAB
              ================================= */}

          {tab === 'news' && (

            newsRequest.loading ? (
              <Loading bn={bn} />
            ) : newsRequest.error ? (
              <ErrorBox
                message={newsRequest.error}
                retry={newsRequest.retry}
                bn={bn}
              />
            ) : (
              <>
                {/* SEARCH */}

                <div className="row g-2 mb-3">

                  <div className="col-12 col-lg-8">
                    <input
                      type="search"
                      className="form-control"
                      value={newsSearch}
                      onChange={(e) =>
                        setNewsSearch(e.target.value)
                      }
                      placeholder={label(
                        'Search news, events and notices...',
                        'খবর, অনুষ্ঠান ও নোটিশ খুঁজুন...'
                      )}
                      aria-label="Search news and events"
                    />
                  </div>

                  {/* SORT */}

                  <div className="col-12 col-lg-4">
                    <select
                      className="form-select"
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value)
                      }
                      aria-label="Sort by date"
                    >
                      <option value="newest">
                        {label(
                          'Newest First',
                          'নতুন আগে'
                        )}
                      </option>

                      <option value="oldest">
                        {label(
                          'Oldest First',
                          'পুরোনো আগে'
                        )}
                      </option>
                    </select>
                  </div>

                </div>

                {/* CATEGORY FILTER BUTTONS */}

                <div className="d-flex flex-wrap gap-2 mb-3">

                  {[
                    {
                      id: '',
                      en: 'All Updates',
                      bn: 'সব আপডেট'
                    },
                    {
                      id: 'news',
                      en: 'News',
                      bn: 'খবর'
                    },
                    {
                      id: 'event',
                      en: 'Events',
                      bn: 'অনুষ্ঠান'
                    },
                    {
                      id: 'notice',
                      en: 'Notices',
                      bn: 'নোটিশ'
                    }
                  ].map((type) => (
                    <button
                      key={type.id || 'all'}
                      type="button"
                      aria-pressed={
                        newsType === type.id
                      }
                      className={`btn btn-sm ${
                        newsType === type.id
                          ? 'btn-navy'
                          : 'btn-outline-navy'
                      }`}
                      onClick={() =>
                        setNewsType(type.id)
                      }
                    >
                      {bn ? type.bn : type.en}
                    </button>
                  ))}

                </div>

                {/* COUNT */}

                <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">

                  <p className="small text-muted mb-0">
                    {visibleNews.length}
                    {' '}
                    {label(
                      'updates found',
                      'টি আপডেট পাওয়া গেছে'
                    )}
                  </p>

                  <p className="small text-muted mb-0">
                    {label(
                      'Sorted by listing date',
                      'প্রকাশের তারিখ অনুযায়ী সাজানো'
                    )}
                  </p>

                </div>

                {/* NEWS LIST */}

                {visibleNews.length === 0 ? (

                  <div className="alert alert-light border">
                    {label(
                      'No matching updates.',
                      'কোনো আপডেট পাওয়া যায়নি।'
                    )}
                  </div>

                ) : (
                  <>
                    <div className="d-flex flex-column gap-3">

                      {visibleNews
                        .slice(0, newsLimit)
                        .map((item) => (
                          <NewsCard
                            key={item.id}
                            n={item}
                            facilityName={
                              item.facilitySlug
                                ? facilityNames[
                                    item.facilitySlug
                                  ]
                                : null
                            }
                          />
                        ))}

                    </div>

                    {/* SHOW MORE */}

                    {newsLimit < visibleNews.length && (
                      <div className="text-center mt-4">

                        <button
                          type="button"
                          className="btn btn-outline-navy"
                          onClick={() =>
                            setNewsLimit(
                              (v) => v + PAGE_SIZE
                            )
                          }
                        >
                          {label(
                            'Show More',
                            'আরও দেখুন'
                          )}

                          {' '}(
                          {visibleNews.length - newsLimit}
                          )
                        </button>

                      </div>
                    )}

                    {/* SHOW LESS */}

                    {newsLimit > PAGE_SIZE && (
                      <div className="text-center mt-2">

                        <button
                          type="button"
                          className="btn btn-link"
                          onClick={() =>
                            setNewsLimit(PAGE_SIZE)
                          }
                        >
                          {label(
                            'Show Less',
                            'কম দেখুন'
                          )}
                        </button>

                      </div>
                    )}

                  </>
                )}
              </>
            )
          )}

        </div>
      </div>
    </>
  );
}
