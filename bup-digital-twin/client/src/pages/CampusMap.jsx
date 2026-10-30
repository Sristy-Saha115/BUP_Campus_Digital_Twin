
import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';

// =====================================
// CAMPUS CONFIGURATION
// =====================================

const CAMPUS_NAME =
  'Bangladesh University of Professionals, Mirpur Cantonment, Dhaka';

const CAMPUS_ADDRESS =
  'Mirpur Cantonment, Dhaka-1216, Bangladesh';

// Approximate centre of BUP Campus.
// Used for opening Google Maps satellite view.
const CAMPUS_CENTER = {
  lat: 23.8411,
  lng: 90.3577
};

const RECENT_KEY = 'bup_map_recent_v1';
const FAVOURITES_KEY = 'bup_map_favourites_v1';

const MAX_RECENT = 8;
const MAX_FAVOURITES = 20;

// =====================================
// QUICK ACCESS
// =====================================

const QUICK_LOCATIONS = [
  {
    id: 'library',
    en: 'Library',
    bn: 'লাইব্রেরি',
    icon: 'fa-book-open',
    query: 'library'
  },
  {
    id: 'cafeteria',
    en: 'Cafeteria',
    bn: 'ক্যাফেটেরিয়া',
    icon: 'fa-utensils',
    query: 'cafeteria'
  },
  {
    id: 'auditorium',
    en: 'Auditorium',
    bn: 'অডিটোরিয়াম',
    icon: 'fa-building',
    query: 'auditorium'
  },
  {
    id: 'medical',
    en: 'Medical',
    bn: 'মেডিকেল',
    icon: 'fa-kit-medical',
    query: 'medical center'
  },
  {
    id: 'atm',
    en: 'ATM',
    bn: 'এটিএম',
    icon: 'fa-money-bill-transfer',
    query: 'ATM'
  },
  {
    id: 'gate',
    en: 'Main Gate',
    bn: 'প্রধান গেট',
    icon: 'fa-door-open',
    query: 'main gate'
  }
];

// =====================================
// NEARBY FACILITIES
// =====================================

const NEARBY_FACILITIES = [
  {
    id: 'hospital',
    en: 'Hospitals',
    bn: 'হাসপাতাল',
    icon: 'fa-hospital',
    query: 'hospitals'
  },
  {
    id: 'pharmacy',
    en: 'Pharmacies',
    bn: 'ফার্মেসি',
    icon: 'fa-pills',
    query: 'pharmacies'
  },
  {
    id: 'bank',
    en: 'Banks & ATMs',
    bn: 'ব্যাংক ও এটিএম',
    icon: 'fa-building-columns',
    query: 'banks and ATMs'
  },
  {
    id: 'restaurant',
    en: 'Restaurants',
    bn: 'রেস্টুরেন্ট',
    icon: 'fa-utensils',
    query: 'restaurants'
  },
  {
    id: 'bus',
    en: 'Bus Stops',
    bn: 'বাস স্টপ',
    icon: 'fa-bus',
    query: 'bus stops'
  },
  {
    id: 'printing',
    en: 'Printing Shops',
    bn: 'প্রিন্টিং শপ',
    icon: 'fa-print',
    query: 'printing shops'
  }
];

const TRAVEL_MODES = [
  {
    id: 'walking',
    en: 'Walking',
    bn: 'হেঁটে',
    icon: 'fa-person-walking'
  },
  {
    id: 'driving',
    en: 'Driving',
    bn: 'গাড়িতে',
    icon: 'fa-car'
  },
  {
    id: 'transit',
    en: 'Transit',
    bn: 'গণপরিবহন',
    icon: 'fa-bus'
  }
];

// =====================================
// GOOGLE MAPS URL HELPERS
// =====================================

// Existing iframe map, no API key needed.
function getEmbedUrl(query) {
  return (
    'https://www.google.com/maps?q=' +
    encodeURIComponent(query) +
    '&output=embed'
  );
}

// Official Google Maps search URL.
function getMapsUrl(query) {
  return (
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(query)
  );
}

// Official Google Maps directions URL.
function getDirectionsUrl(destination, mode, origin) {
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: mode
  });

  if (origin) {
    params.set('origin', origin);
  }

  return (
    'https://www.google.com/maps/dir/?' +
    params.toString()
  );
}

// Official Google Maps satellite URL.
// A centre coordinate is required to focus
// the satellite view on the intended location.
function getSatelliteUrl(center) {
  const params = new URLSearchParams({
    api: '1',
    map_action: 'map',
    center: `${center.lat},${center.lng}`,
    zoom: '17',
    basemap: 'satellite'
  });

  return (
    'https://www.google.com/maps/@?' +
    params.toString()
  );
}

function getCampusSearchQuery(query) {
  return `${query} near ${CAMPUS_NAME}`;
}

// =====================================
// LOCAL STORAGE HELPERS
// =====================================

function readPlaces(key, limit) {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(key) || '[]'
    );

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored
      .filter(
        (item) =>
          item &&
          typeof item.query === 'string' &&
          typeof item.labelEn === 'string' &&
          typeof item.labelBn === 'string' &&
          item.query.trim() &&
          item.type !== 'me' &&
          !/^-?\d+\.\d+,-?\d+\.\d+$/.test(
            item.query.trim()
          )
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

function writePlaces(key, places) {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(places)
    );
  } catch {
    // Search and map remain available.
  }
}

// =====================================
// REUSABLE GOOGLE MAP FRAME
// =====================================

function GoogleMapFrame({ src, version }) {
  return (
    <iframe
      key={`${src}-${version}`}
      title="BUP Interactive Google Map"
      src={src}
      width="100%"
      height="100%"
      loading="eager"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      style={{
        display: 'block',
        border: 0
      }}
    />
  );
}

// =====================================
// MAIN COMPONENT
// =====================================

export default function CampusMap() {
  const { lang } = useLang();
  const bn = lang === 'bn';

  const [search, setSearch] = useState('');

  const [mapQuery, setMapQuery] = useState(
    CAMPUS_NAME
  );

  const [selectedPlace, setSelectedPlace] =
    useState(null);

  const [activeQuick, setActiveQuick] = useState('');
  const [activeNearby, setActiveNearby] = useState('');

  const [travelMode, setTravelMode] =
    useState('walking');

  const [expanded, setExpanded] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);

  // Browser location is kept only in React state.
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] =
    useState('');

  const [notice, setNotice] = useState('');

  // =====================================
  // PHASE 6 STORAGE
  // =====================================

  const [recentSearches, setRecentSearches] =
    useState(() =>
      typeof window !== 'undefined'
        ? readPlaces(RECENT_KEY, MAX_RECENT)
        : []
    );

  const [favourites, setFavourites] =
    useState(() =>
      typeof window !== 'undefined'
        ? readPlaces(FAVOURITES_KEY, MAX_FAVOURITES)
        : []
    );

  useEffect(() => {
    writePlaces(RECENT_KEY, recentSearches);
  }, [recentSearches]);

  useEffect(() => {
    writePlaces(FAVOURITES_KEY, favourites);
  }, [favourites]);

  // =====================================
  // CURRENT MAP VALUES
  // =====================================

  const isDefaultMap =
    mapQuery === CAMPUS_NAME && !selectedPlace;

  const isNearbyCategory =
    selectedPlace?.type === 'nearby';

  const isMyLocation =
    selectedPlace?.type === 'me';

  const selectedLabel = selectedPlace
    ? (
        bn
          ? selectedPlace.labelBn
          : selectedPlace.labelEn
      )
    : CAMPUS_NAME;

  const currentEmbedUrl = getEmbedUrl(mapQuery);
  const currentMapsUrl = getMapsUrl(mapQuery);

  const myCoordinates = myLocation
    ? `${myLocation.lat},${myLocation.lng}`
    : '';

  const currentDirectionsUrl = getDirectionsUrl(
    mapQuery,
    travelMode
  );

  const routeToCampusUrl = getDirectionsUrl(
    CAMPUS_NAME,
    travelMode,
    myCoordinates || undefined
  );

  // Satellite view focuses on BUP by default,
  // or on user location when selected.
  // Generic searched buildings do not have
  // verified coordinates.
  const satelliteCenter =
    isMyLocation && myLocation
      ? myLocation
      : CAMPUS_CENTER;

  const satelliteUrl = getSatelliteUrl(
    satelliteCenter
  );

  const isFavourite = selectedPlace
    ? favourites.some(
        (item) =>
          item.query.toLowerCase() ===
          selectedPlace.query.toLowerCase()
      )
    : false;

  // =====================================
  // HISTORY
  // =====================================

  const addToRecent = (place) => {
    if (place.type === 'me') return;

    setRecentSearches((previous) => [
      place,
      ...previous.filter(
        (item) =>
          item.query.toLowerCase() !==
          place.query.toLowerCase()
      )
    ].slice(0, MAX_RECENT));
  };

  const clearHistory = () => {
    setRecentSearches([]);
  };

  // =====================================
  // FAVOURITES
  // =====================================

  const toggleFavourite = (place) => {
    if (!place || place.type === 'me') {
      return;
    }

    setFavourites((previous) => {
      const exists = previous.some(
        (item) =>
          item.query.toLowerCase() ===
          place.query.toLowerCase()
      );

      if (exists) {
        return previous.filter(
          (item) =>
            item.query.toLowerCase() !==
            place.query.toLowerCase()
        );
      }

      return [
        place,
        ...previous
      ].slice(0, MAX_FAVOURITES);
    });
  };

  // =====================================
  // COMMON PLACE SELECTION
  // =====================================

  const selectPlace = (place) => {
    if (!place?.query) return;

    setSelectedPlace(place);
    setMapQuery(place.query);

    setSearch(
      bn ? place.labelBn : place.labelEn
    );

    setActiveQuick(
      place.type === 'quick'
        ? place.id
        : ''
    );

    setActiveNearby(
      place.type === 'nearby'
        ? place.id
        : ''
    );

    setNotice('');

    setMapVersion((value) => value + 1);
    addToRecent(place);
  };

  // =====================================
  // SEARCH
  // =====================================

  const handleSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) return;

    selectPlace({
      id: `search-${value.toLowerCase()}`,
      type: 'search',
      query: getCampusSearchQuery(value),
      labelEn: value,
      labelBn: value
    });
  };

  // =====================================
  // QUICK ACCESS
  // =====================================

  const openQuickLocation = (item) => {
    selectPlace({
      id: item.id,
      type: 'quick',
      query: getCampusSearchQuery(item.query),
      labelEn: item.en,
      labelBn: item.bn
    });
  };

  // =====================================
  // NEARBY FACILITIES
  // =====================================

  const openNearby = (item) => {
    selectPlace({
      id: item.id,
      type: 'nearby',
      query: getCampusSearchQuery(item.query),
      labelEn: item.en,
      labelBn: item.bn
    });
  };

  // =====================================
  // RESET / BACK TO CAMPUS
  // =====================================

  const resetMap = () => {
    setMapQuery(CAMPUS_NAME);
    setSelectedPlace(null);

    setSearch('');
    setActiveQuick('');
    setActiveNearby('');

    setNotice('');
    setMapVersion((value) => value + 1);
  };

  const resetNavigation = () => {
    setTravelMode('walking');
    resetMap();
  };

  // =====================================
  // MY LOCATION
  // =====================================

  const findMyLocation = () => {
    setLocationError('');
    setNotice('');

    if (!navigator.geolocation) {
      setLocationError(
        bn
          ? 'এই browser-এ Location support নেই।'
          : 'Geolocation is not supported by this browser.'
      );
      return;
    }

    if (
      !window.isSecureContext &&
      window.location.hostname !== 'localhost'
    ) {
      setLocationError(
        bn
          ? 'Location ব্যবহার করতে HTTPS প্রয়োজন।'
          : 'Location requires HTTPS or localhost.'
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        setLocating(false);
        setLocationError('');

        setNotice(
          bn
            ? 'আপনার অবস্থান পাওয়া গেছে।'
            : 'Your location was detected.'
        );
      },

      (error) => {
        setLocating(false);

        if (error.code === 1) {
          setLocationError(
            bn
              ? 'Location permission দেওয়া হয়নি।'
              : 'Location permission was denied.'
          );
        } else if (error.code === 3) {
          setLocationError(
            bn
              ? 'Location খুঁজতে সময়সীমা শেষ হয়েছে।'
              : 'Location request timed out.'
          );
        } else {
          setLocationError(
            bn
              ? 'বর্তমানে Location পাওয়া যাচ্ছে না।'
              : 'Your location is currently unavailable.'
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const showMyLocation = () => {
    if (!myLocation) return;

    const coordinates =
      `${myLocation.lat},${myLocation.lng}`;

    setMapQuery(coordinates);

    setSelectedPlace({
      id: 'my-location',
      type: 'me',
      query: coordinates,
      labelEn: 'My Location',
      labelBn: 'আমার অবস্থান'
    });

    setSearch('');
    setActiveQuick('');
    setActiveNearby('');

    setNotice('');
    setMapVersion((value) => value + 1);
  };

  const clearMyLocation = () => {
    setMyLocation(null);
    setLocationError('');

    if (isMyLocation) {
      resetMap();
    }
  };

  // =====================================
  // COPY / SHARE
  // =====================================

  const copyLocation = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(
        currentMapsUrl
      );

      setNotice(
        bn
          ? 'লোকেশন লিংক কপি হয়েছে।'
          : 'Location link copied.'
      );
    } catch {
      window.prompt(
        bn
          ? 'লিংকটি কপি করুন:'
          : 'Copy this link:',
        currentMapsUrl
      );
    }
  };

  const shareLocation = async () => {
    if (!navigator.share) {
      await copyLocation();
      return;
    }

    try {
      await navigator.share({
        title: selectedLabel,
        text: selectedLabel,
        url: currentMapsUrl
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        await copyLocation();
      }
    }
  };

  // =====================================
  // FULLSCREEN
  // =====================================

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    window.addEventListener(
      'keydown',
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        onKeyDown
      );
    };
  }, [expanded]);

  // =====================================
  // SAVED PLACE ITEM
  // =====================================

  const renderSavedPlace = (place, section) => {
    const label = bn
      ? place.labelBn
      : place.labelEn;

    const saved = favourites.some(
      (item) =>
        item.query.toLowerCase() ===
        place.query.toLowerCase()
    );

    return (
      <div
        key={place.query}
        className="d-flex align-items-center gap-2 border rounded-3 p-2 mb-2"
      >
        <button
          type="button"
          className="btn btn-link text-start text-decoration-none flex-grow-1 p-1"
          style={{
            minWidth: 0,
            overflowWrap: 'anywhere'
          }}
          onClick={() => selectPlace(place)}
        >
          <i
            className={`fa-solid ${
              section === 'favourites'
                ? 'fa-star'
                : 'fa-clock-rotate-left'
            } me-2`}
          />
          {label}
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => toggleFavourite(place)}
          title={
            saved
              ? 'Remove Favourite'
              : 'Add Favourite'
          }
          aria-label={
            saved
              ? `Remove ${label} from favourites`
              : `Add ${label} to favourites`
          }
        >
          <i
            className={`fa-${
              saved ? 'solid' : 'regular'
            } fa-star`}
          />
        </button>
      </div>
    );
  };

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <>
      <PageHero
        icon="fa-map-location-dot"
        title={
          bn ? 'ক্যাম্পাস ম্যাপ' : 'Campus Map'
        }
        sub={
          bn
            ? 'বিইউপি ক্যাম্পাস ও আশপাশের জায়গা দেখুন'
            : 'Explore BUP Campus and nearby locations'
        }
      />

      <div className="container py-4">
        <div className="panel">

          {/* CAMPUS HEADER */}

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h4 className="fw-bold mb-1">
                <i className="fa-solid fa-location-dot text-warning me-2" />
                Bangladesh University of Professionals
              </h4>

              <p className="text-muted mb-0">
                {CAMPUS_ADDRESS}
              </p>
            </div>

            <a
              href={currentMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-navy"
            >
              <i className="fa-solid fa-map me-2" />
              Google Maps
            </a>
          </div>

          {/* SEARCH */}

          <div className="mb-4">
            <label
              htmlFor="campus-map-search"
              className="form-label fw-semibold"
            >
              <i className="fa-solid fa-magnifying-glass me-2" />
              {bn
                ? 'ক্যাম্পাসে জায়গা খুঁজুন'
                : 'Search Campus Places'}
            </label>

            <form onSubmit={handleSearch}>
              <div className="input-group">
                <input
                  id="campus-map-search"
                  type="search"
                  className="form-control"
                  placeholder="Library, Cafeteria, Auditorium..."
                  value={search}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                <button
                  type="submit"
                  className="btn btn-navy"
                  disabled={!search.trim()}
                >
                  <i className="fa-solid fa-magnifying-glass me-2" />
                  {bn ? 'খুঁজুন' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {/* QUICK ACCESS */}

          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fa-solid fa-location-arrow me-2" />
              {bn
                ? 'দ্রুত জায়গা খুঁজুন'
                : 'Quick Access Locations'}
            </h6>

            <div className="d-flex flex-wrap gap-2">
              {QUICK_LOCATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openQuickLocation(item)}
                  aria-pressed={activeQuick === item.id}
                  className={`btn btn-sm ${
                    activeQuick === item.id
                      ? 'btn-navy'
                      : 'btn-outline-navy'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} me-2`} />
                  {bn ? item.bn : item.en}
                </button>
              ))}
            </div>
          </div>

          {/* NEARBY FACILITIES */}

          <div className="mb-4">
            <h6 className="fw-bold mb-2">
              <i className="fa-solid fa-map-pin me-2" />
              {bn
                ? 'আশপাশের প্রয়োজনীয় জায়গা'
                : 'Nearby Facilities'}
            </h6>

            <p className="small text-muted mb-3">
              {bn
                ? 'বিইউপি ক্যাম্পাসের আশপাশের সেবা খুঁজুন।'
                : 'Find useful services around BUP Campus.'}
            </p>

            <div className="row g-2">
              {NEARBY_FACILITIES.map((item) => (
                <div
                  key={item.id}
                  className="col-6 col-md-4 col-lg-2"
                >
                  <button
                    type="button"
                    onClick={() => openNearby(item)}
                    aria-pressed={activeNearby === item.id}
                    className={`btn w-100 h-100 border rounded-3 py-3 px-2 ${
                      activeNearby === item.id
                        ? 'btn-navy'
                        : 'btn-outline-navy'
                    }`}
                    style={{
                      minHeight: 88
                    }}
                  >
                    <i
                      className={`fa-solid ${item.icon} d-block mb-2`}
                      style={{ fontSize: 22 }}
                    />
                    <span className="small fw-semibold">
                      {bn ? item.bn : item.en}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* =====================================
              MY LOCATION
              ===================================== */}

          <div className="border rounded-3 p-3 mb-4">
            <h5 className="fw-bold mb-2">
              <i className="fa-solid fa-location-crosshairs me-2" />
              {bn ? 'আমার অবস্থান' : 'My Location'}
            </h5>

            <p className="small text-muted mb-3">
              {bn
                ? 'Browser permission দিলে আপনার অবস্থান খুঁজে পাওয়া যাবে।'
                : 'Allow browser location permission to find your position.'}
            </p>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-navy"
                onClick={findMyLocation}
                disabled={locating}
              >
                <i className={`fa-solid ${
                  locating
                    ? 'fa-spinner fa-spin'
                    : 'fa-location-crosshairs'
                } me-2`} />

                {locating
                  ? (bn ? 'খোঁজা হচ্ছে...' : 'Locating...')
                  : (bn ? 'আমার অবস্থান খুঁজুন' : 'Find My Location')}
              </button>

              <button
                type="button"
                className="btn btn-outline-navy"
                onClick={showMyLocation}
                disabled={!myLocation}
              >
                <i className="fa-solid fa-map-location-dot me-2" />
                {bn
                  ? 'ম্যাপে আমার অবস্থান'
                  : 'Show My Location on Map'}
              </button>

              <a
                href={routeToCampusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
              >
                <i className="fa-solid fa-route me-2" />
                {bn
                  ? 'বিইউপি যাওয়ার পথ'
                  : 'Route to BUP'}
              </a>

              {myLocation && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={clearMyLocation}
                >
                  <i className="fa-solid fa-xmark me-2" />
                  {bn
                    ? 'অবস্থান মুছুন'
                    : 'Clear My Location'}
                </button>
              )}
            </div>

            {myLocation && (
              <p
                className="small text-success mt-3 mb-0"
                role="status"
              >
                <i className="fa-solid fa-circle-check me-2" />
                {bn
                  ? 'অবস্থান পাওয়া গেছে। আনুমানিক নির্ভুলতা:'
                  : 'Location detected. Approximate accuracy:'}
                {' '}
                {Math.round(myLocation.accuracy)} m
              </p>
            )}

            {locationError && (
              <p
                className="small text-danger mt-3 mb-0"
                role="alert"
              >
                {locationError}
              </p>
            )}
          </div>

          {/* =====================================
              MAP / SATELLITE TOOLS
              ===================================== */}

          <div className="border rounded-3 p-3 mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fa-solid fa-layer-group me-2" />
              {bn ? 'ম্যাপ ভিউ' : 'Map View'}
            </h6>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-navy"
                onClick={resetMap}
              >
                <i className="fa-solid fa-map me-2" />
                {bn ? 'সাধারণ ম্যাপ' : 'Normal Map'}
              </button>

              <a
                href={satelliteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-navy"
              >
                <i className="fa-solid fa-satellite me-2" />
                {bn
                  ? 'স্যাটেলাইট ভিউ'
                  : 'Satellite View'}

                <i className="fa-solid fa-arrow-up-right-from-square ms-2" />
              </a>
            </div>

            <p className="small text-muted mt-2 mb-0">
              {bn
                ? 'Satellite View Google Maps-এ নতুন ট্যাবে খুলবে। সাধারণ অবস্থায় BUP campus centre দেখাবে।'
                : 'Satellite View opens in a new Google Maps tab. It shows the approximate BUP campus centre by default.'}
            </p>
          </div>

          {/* =====================================
              SEARCH HISTORY & FAVOURITES
              ===================================== */}

          <div className="border rounded-3 p-3 mb-4">
            <h5 className="fw-bold mb-3">
              <i className="fa-solid fa-bookmark me-2" />
              {bn
                ? 'আমার ক্যাম্পাস লোকেশন'
                : 'My Campus Places'}
            </h5>

            <div className="row g-3">

              <div className="col-12 col-lg-6">
                <div className="border rounded-3 p-3 h-100">

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h6 className="fw-bold mb-0">
                      <i className="fa-solid fa-clock-rotate-left me-2" />
                      {bn
                        ? 'সাম্প্রতিক সার্চ'
                        : 'Recent Searches'}
                    </h6>

                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={clearHistory}
                      >
                        <i className="fa-solid fa-trash-can me-1" />
                        {bn
                          ? 'হিস্ট্রি মুছুন'
                          : 'Clear History'}
                      </button>
                    )}
                  </div>

                  {recentSearches.length === 0 ? (
                    <p className="small text-muted mb-0">
                      {bn
                        ? 'এখনো কোনো সার্চ নেই।'
                        : 'No recent searches yet.'}
                    </p>
                  ) : (
                    recentSearches.map((place) =>
                      renderSavedPlace(place, 'recent')
                    )
                  )}
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="border rounded-3 p-3 h-100">

                  <h6 className="fw-bold mb-3">
                    <i className="fa-solid fa-star me-2" />
                    {bn
                      ? 'প্রিয় লোকেশন'
                      : 'Favourite Locations'}
                  </h6>

                  {favourites.length === 0 ? (
                    <p className="small text-muted mb-0">
                      {bn
                        ? 'Star button দিয়ে Favourite করুন।'
                        : 'Click the star button to save favourites.'}
                    </p>
                  ) : (
                    favourites.map((place) =>
                      renderSavedPlace(place, 'favourites')
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SELECTED LOCATION */}

          {!isDefaultMap && (
            <div className="alert alert-info d-flex flex-wrap justify-content-between align-items-center gap-2 py-2">
              <span>
                <i className="fa-solid fa-location-crosshairs me-2" />

                {bn
                  ? 'নির্বাচিত স্থান:'
                  : 'Selected location:'}
                {' '}
                <strong>{selectedLabel}</strong>
              </span>

              <div className="d-flex flex-wrap gap-2">
                {!isMyLocation && (
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      isFavourite
                        ? 'btn-warning'
                        : 'btn-outline-warning'
                    }`}
                    onClick={() =>
                      toggleFavourite(selectedPlace)
                    }
                  >
                    <i className={`fa-${
                      isFavourite
                        ? 'solid'
                        : 'regular'
                    } fa-star me-1`} />

                    {isFavourite
                      ? (bn ? 'Favourite থেকে সরান' : 'Remove Favourite')
                      : (bn ? 'Favourite করুন' : 'Add Favourite')}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={resetMap}
                >
                  <i className="fa-solid fa-rotate-left me-1" />
                  {bn ? 'রিসেট' : 'Reset'}
                </button>
              </div>
            </div>
          )}

          {/* =====================================
              SMART NAVIGATION & SHARING
              ===================================== */}

          <div
            className="border rounded-3 p-3 mb-4"
            style={{
              background: '#f8fafc'
            }}
          >
            <h6 className="fw-bold mb-2">
              <i className="fa-solid fa-route me-2" />
              {bn
                ? 'স্মার্ট নেভিগেশন'
                : 'Smart Navigation'}
            </h6>

            <p className="small text-muted mb-3">
              {bn
                ? 'যাতায়াতের ধরন নির্বাচন করুন।'
                : 'Choose your travel mode.'}
            </p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {TRAVEL_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    setTravelMode(mode.id)
                  }
                  aria-pressed={
                    travelMode === mode.id
                  }
                  className={`btn btn-sm ${
                    travelMode === mode.id
                      ? 'btn-navy'
                      : 'btn-outline-navy'
                  }`}
                >
                  <i className={`fa-solid ${mode.icon} me-2`} />
                  {bn ? mode.bn : mode.en}
                </button>
              ))}
            </div>

            <p className="small mb-3">
              <span className="text-muted">
                {bn ? 'গন্তব্য:' : 'Destination:'}
              </span>
              {' '}
              <strong>
                {isNearbyCategory
                  ? (bn
                    ? 'Google Maps-এ নির্দিষ্ট জায়গা নির্বাচন করুন'
                    : 'Choose a specific place in Google Maps')
                  : selectedLabel}
              </strong>
            </p>

            <div className="d-flex flex-wrap gap-2">

              {isNearbyCategory ? (
                <a
                  href={currentMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                >
                  <i className="fa-solid fa-map-location-dot me-2" />
                  {bn
                    ? 'জায়গা নির্বাচন করুন'
                    : 'Choose a Place'}
                </a>
              ) : (
                <a
                  href={currentDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                >
                  <i className="fa-solid fa-diamond-turn-right me-2" />
                  {bn
                    ? 'দিকনির্দেশনা দেখুন'
                    : 'Get Directions'}
                </a>
              )}

              <button
                type="button"
                className="btn btn-outline-navy"
                onClick={copyLocation}
              >
                <i className="fa-solid fa-link me-2" />
                {bn
                  ? 'লিংক কপি করুন'
                  : 'Copy Location Link'}
              </button>

              <button
                type="button"
                className="btn btn-outline-navy"
                onClick={shareLocation}
              >
                <i className="fa-solid fa-share-nodes me-2" />
                {bn
                  ? 'শেয়ার করুন'
                  : 'Share Location'}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={resetNavigation}
              >
                <i className="fa-solid fa-rotate-left me-2" />
                {bn
                  ? 'নেভিগেশন রিসেট'
                  : 'Reset Navigation'}
              </button>
            </div>

            {notice && (
              <p
                className="small text-success mt-3 mb-0"
                role="status"
              >
                <i className="fa-solid fa-circle-check me-2" />
                {notice}
              </p>
            )}
          </div>

          {/* =====================================
              MAP TOOLBAR
              ===================================== */}

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

            <span className="small text-muted">
              <i className="fa-solid fa-hand-pointer me-2" />
              {bn
                ? 'ম্যাপ Zoom ও Drag করে দেখুন'
                : 'Zoom and drag to explore the campus'}
            </span>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-navy"
                onClick={resetMap}
              >
                <i className="fa-solid fa-rotate-left me-2" />
                {bn
                  ? 'ক্যাম্পাসে ফিরুন'
                  : 'Back to Campus'}
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setExpanded(true)}
              >
                <i className="fa-solid fa-expand me-2" />
                {bn
                  ? 'বড় করুন'
                  : 'Expand Map'}
              </button>
            </div>
          </div>

          {/* NORMAL MAP */}

          <div
            className="rounded-3 overflow-hidden border"
            style={{
              width: '100%',
              height: 'clamp(350px, 65vh, 720px)'
            }}
          >
            {!expanded && (
              <GoogleMapFrame
                src={currentEmbedUrl}
                version={mapVersion}
              />
            )}
          </div>

          {/* MAP FOOTER */}

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">

            <p className="small text-muted mb-0">
              <i className="fa-solid fa-circle-info me-2" />
              {bn
                ? 'ম্যাপের তথ্য Google Maps-এর উপর নির্ভরশীল।'
                : 'Map information depends on Google Maps data.'}
            </p>

            <a
              href={currentMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-navy btn-sm"
            >
              {bn
                ? 'সম্পূর্ণ Google Maps-এ খুলুন'
                : 'Open Full Google Maps'}

              <i className="fa-solid fa-arrow-up-right-from-square ms-2" />
            </a>
          </div>

        </div>
      </div>

      {/* =====================================
          FULLSCREEN MAP
          ===================================== */}

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded campus map"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            className="d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2 border-bottom"
            style={{
              background: '#fff',
              flexShrink: 0
            }}
          >
            <strong>
              <i className="fa-solid fa-map-location-dot me-2" />
              BUP Campus Map
            </strong>

            <div className="d-flex flex-wrap gap-2">

              <button
                type="button"
                className="btn btn-sm btn-outline-navy"
                onClick={resetMap}
              >
                <i className="fa-solid fa-rotate-left me-1" />
                {bn ? 'ক্যাম্পাস' : 'Campus'}
              </button>

              <a
                href={satelliteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="fa-solid fa-satellite me-1" />
                Satellite
              </a>

              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() =>
                  setExpanded(false)
                }
              >
                <i className="fa-solid fa-compress me-1" />
                {bn
                  ? 'বন্ধ করুন'
                  : 'Close Fullscreen'}
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%'
            }}
          >
            <GoogleMapFrame
              src={currentEmbedUrl}
              version={mapVersion}
            />
          </div>
        </div>
      )}
    </>
  );
}
