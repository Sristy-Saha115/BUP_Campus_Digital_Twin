const router = require('express').Router();
const { Place, Faculty, ClubEvent, Club } = require('../models');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Smart campus search across places, faculty, clubs and events
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  if (!q) return res.json({ results: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [places, faculty, clubs, events] = await Promise.all([
    Place.find({ $or: [{ title: rx }, { details: rx }, { category: rx }] }).limit(10),
    Faculty.find({ $or: [{ name: rx }, { department: rx }] }).limit(10),
    Club.find({ $or: [{ name: rx }, { description: rx }] }).limit(10),
    ClubEvent.find({ $or: [{ title: rx }, { clubName: rx }, { details: rx }] }).limit(10),
  ]);
  const results = [
    ...places.map((p) => ({ type: p.category, title: p.title, details: p.details, link: p.link })),
    ...faculty.map((f) => ({ type: 'Faculty', title: f.name, details: `Department of ${f.department}`, link: '/faculty' })),
    ...clubs.map((c) => ({ type: 'Club', title: c.name, details: c.description, link: '/clubs' })),
    ...events.map((e) => ({ type: 'Event', title: e.title, details: `${e.clubName} · ${e.date || 'Date TBA'}`, link: '/clubs' })),
  ];
  res.json({ results });
});

// Simple rule-based assistant (no external AI; add one server-side later if you want)
const RULES = [
  { k: ['map', 'location', 'মানচিত্র', 'ম্যাপ'], en: 'Open Campus Map from the menu to see the interactive map and the official 2D map.', bn: 'মেনু থেকে "ক্যাম্পাস ম্যাপ" খুলুন — ইন্টারেক্টিভ ম্যাপ ও অফিসিয়াল ২ডি ম্যাপ পাবেন।' },
  { k: ['bus', 'transport', 'বাস'], en: 'Bus Tracking shows route and position of each bus (currently demo data).', bn: 'বাস ট্র্যাকিং পেজে প্রতিটি বাসের রুট ও অবস্থান দেখা যায় (এখন ডেমো ডেটা)।' },
  { k: ['faculty', 'consult', 'slot', 'শিক্ষক', 'স্লট'], en: 'Log in, then open Faculty Slots to book a consultation time.', bn: 'লগইন করে "ফ্যাকাল্টি স্লট" থেকে পরামর্শের সময় বুক করুন।' },
  { k: ['blood', 'donor', 'রক্ত'], en: 'Use Emergency Blood Network to post or view urgent blood requests.', bn: 'জরুরি রক্তের অনুরোধ দিতে বা দেখতে "রক্ত নেটওয়ার্ক" পেজ ব্যবহার করুন।' },
  { k: ['club', 'event', 'ক্লাব', 'ইভেন্ট'], en: 'Clubs & Events lists all BUP clubs with their Facebook pages and upcoming events.', bn: '"ক্লাব" পেজে সব ক্লাবের ফেসবুক পেজ ও আসন্ন ইভেন্ট আছে।' },
  { k: ['scholar', 'বৃত্তি'], en: 'See Scholarships for programs. Always confirm deadlines with the official provider.', bn: 'বৃত্তির তথ্য "স্কলারশিপ" পেজে আছে। শেষ তারিখ অবশ্যই অফিসিয়াল সূত্রে যাচাই করুন।' },
];
router.post('/chat', (req, res) => {
  const msg = String(req.body.message || '').toLowerCase();
  const lang = req.body.lang === 'bn' ? 'bn' : 'en';
  const hit = RULES.find((r) => r.k.some((w) => msg.includes(w)));
  res.json({
    reply: hit ? hit[lang] : lang === 'bn'
      ? 'দুঃখিত, বুঝতে পারিনি। ম্যাপ, বাস, স্লট, রক্ত, ক্লাব বা স্কলারশিপ নিয়ে জিজ্ঞাসা করুন।'
      : 'Sorry, I did not understand. Try asking about the map, bus, slots, blood, clubs or scholarships.',
  });
});

module.exports = router;
