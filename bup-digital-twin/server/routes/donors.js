const router = require('express').Router();
const { Donor } = require('../models');
const { requireAuth } = require('../middleware/auth');

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// "Rahim Uddin Khan" -> "Rahim K."  (public view hides full names)
const shortName = (n) => {
  const p = String(n).trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
};

// PUBLIC: anyone can see who donates, but no phone/batch/last-donation details
router.get('/public', async (req, res) => {
  const filter = GROUPS.includes(req.query.group) ? { bloodGroup: req.query.group } : {};
  const donors = await Donor.find(filter).sort('-updatedAt').limit(200);
  res.json({
    donors: donors.map((d) => ({ _id: d._id, name: shortName(d.name), bloodGroup: d.bloodGroup, area: d.area, available: d.available })),
  });
});

router.get('/stats', async (req, res) => {
  const rows = await Donor.aggregate([{ $match: { available: true } }, { $group: { _id: '$bloodGroup', n: { $sum: 1 } } }]);
  const stats = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  rows.forEach((r) => { stats[r._id] = r.n; });
  res.json({ stats });
});

// LOGGED IN: full details
router.get('/', requireAuth, async (req, res) => {
  const filter = GROUPS.includes(req.query.group) ? { bloodGroup: req.query.group } : {};
  res.json({ donors: await Donor.find(filter).sort('-updatedAt').limit(500) });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ donor: await Donor.findOne({ user: req.user.id }) });
});

// Create or update my own donor profile
router.post('/', requireAuth, async (req, res) => {
  const { name, bloodGroup, phone, batchDept, area, lastDonated, available } = req.body;
  if (!name || !bloodGroup || !phone) return res.status(400).json({ error: 'Name, blood group and phone are required.' });
  if (!GROUPS.includes(bloodGroup)) return res.status(400).json({ error: 'Invalid blood group.' });
  if (!BD_PHONE.test(String(phone).replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).' });
  }
  const donor = await Donor.findOneAndUpdate(
    { user: req.user.id },
    { name, bloodGroup, phone, batchDept, area, lastDonated, available: available !== false },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ message: 'Donor profile saved. Thank you!', donor });
});

router.delete('/me', requireAuth, async (req, res) => {
  await Donor.deleteOne({ user: req.user.id });
  res.json({ ok: true });
});

module.exports = router;
