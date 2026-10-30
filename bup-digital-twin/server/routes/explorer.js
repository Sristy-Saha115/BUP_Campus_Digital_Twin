// Campus Explorer - PUBLIC, READ-ONLY endpoints (no login needed, no user data, no writes).
//   GET /api/explorer/facilities?q=&category=
//   GET /api/explorer/facilities/:slug
//   GET /api/explorer/news?q=&type=news|event|notice
// Data comes from server/campusExplorerData.js (copied from the official BUP website, nothing guessed).
const router = require('express').Router();
const { CATEGORIES, FACILITIES, NEWS, META } = require('../campusExplorerData');

const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));
const TYPES = ['news', 'event', 'notice'];

// Rough sanity box around Dhaka: it only rejects typing mistakes, it does not "verify" a location.
const inDhaka = (c) =>
  Array.isArray(c) && c.length === 2 && c.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
  c[0] >= 23.6 && c[0] <= 24.0 && c[1] >= 90.2 && c[1] <= 90.6;

const clean = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const norm = (s) => clean(s).slice(0, 80);          // user input: limited length
const tokens = (s) => norm(s).split(' ').filter(Boolean);

// What the browser receives. Coordinates are only sent when the entry is FULLY verified.
function publicFacility(f) {
  const l = f.location || {};
  const verified = !!(l.coordsVerified && inDhaka(l.coords) && l.verifiedOn && l.verifiedBy);
  const mapStatus = verified ? 'verified' : l.text ? 'text-only' : 'none';
  const missing = [];
  if (!l.text) missing.push('location');
  if (!verified) missing.push('mapPosition');
  if (!f.hours) missing.push('hours');
  if (!f.phone) missing.push('contact');
  return {
    slug: f.slug,
    name: f.name,
    category: f.category,
    categoryLabel: CAT_LABEL[f.category] || f.category,
    icon: f.icon,
    summary: f.summary,
    highlights: f.highlights || [],
    hours: f.hours || null,
    phone: f.phone || null,
    appLink: f.appLink || null,
    sourceUrl: f.sourceUrl,
    sourceTitle: f.sourceTitle,
    capturedAt: META.capturedAt,
    mapStatus,
    missing,
    location: {
      text: l.text || null,
      textSource: l.textSource || null,
      coords: verified ? l.coords : null,
      verifiedOn: verified ? l.verifiedOn : null,
    },
  };
}

const haystack = (f) =>
  clean([f.name, f.categoryLabel, f.summary, ...(f.highlights || []), f.location.text].join(' '));

const sendJson = (res, body) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(body);
};

router.get('/facilities', (req, res) => {
  const q = tokens(req.query.q);
  const category = norm(req.query.category);
  const all = FACILITIES.map(publicFacility);
  const facilities = all.filter(
    (f) => (!category || f.category === category) && q.every((w) => haystack(f).includes(w))
  );
  const categories = CATEGORIES.map((c) => ({
    key: c.key, icon: c.icon, label: c.label, count: all.filter((f) => f.category === c.key).length,
  })).filter((c) => c.count);
  sendJson(res, {
    facilities,
    categories,
    total: all.length,
    verifiedCount: all.filter((f) => f.mapStatus === 'verified').length,
    textLocationCount: all.filter((f) => f.mapStatus === 'text-only').length,
    capturedAt: META.capturedAt,
    site: META.site,
  });
});

router.get('/facilities/:slug', (req, res) => {
  const slug = String(req.params.slug || '');
  const found = /^[a-z0-9-]{1,60}$/.test(slug) && FACILITIES.find((f) => f.slug === slug);
  if (!found) return res.status(404).json({ error: 'Facility not found.' });
  sendJson(res, { facility: publicFacility(found) });
});

router.get('/news', (req, res) => {
  const q = tokens(req.query.q);
  const type = norm(req.query.type);
  const items = NEWS.filter(
    (n) => (!TYPES.includes(type) || n.type === type) &&
      q.every((w) => clean([n.title, n.summary, n.venue, n.eventDate].join(' ')).includes(w))
  )
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const today = new Date().toISOString().slice(0, 10);
  sendJson(res, {
    items,
    total: NEWS.length,
    upcomingEvents: NEWS.filter((n) => n.type === 'event' && n.date >= today).length,
    capturedAt: META.capturedAt,
    note: META.newsNote,
    site: META.site,
  });
});

module.exports = router;
