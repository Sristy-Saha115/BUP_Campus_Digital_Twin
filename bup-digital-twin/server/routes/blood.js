const router = require('express').Router();
const { BloodRequest } = require('../models');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const cleanPhone = (p) => String(p || '').replace(/[\s-]/g, '');

// ---------- Blood requests ----------
// Everyone can read requests, but phone numbers are only returned to logged-in users.
router.get('/', optionalAuth, async (req, res) => {
  const filter = { status: 'Open' };
  if (GROUPS.includes(req.query.group)) filter.bloodGroup = req.query.group;
  const rows = await BloodRequest.find(filter).sort('-createdAt').limit(50);
  const loggedIn = !!req.user;
  res.json({
    loggedIn,
    requests: rows.map((r) => ({
      _id: r._id, patientName: r.patientName, bloodGroup: r.bloodGroup, hospital: r.hospital,
      district: r.district, status: r.status, createdAt: r.createdAt,
      contactNumber: loggedIn ? r.contactNumber : null,
    })),
  });
});

// Anyone can post an emergency request
router.post('/', async (req, res) => {
  const { patientName, bloodGroup, hospital, contactNumber, district } = req.body;
  if (!bloodGroup || !hospital || !contactNumber) return res.status(400).json({ error: 'Please fill all required blood request details.' });
  if (!GROUPS.includes(bloodGroup)) return res.status(400).json({ error: 'Invalid blood group.' });
  if (!BD_PHONE.test(cleanPhone(contactNumber))) {
    return res.status(400).json({ error: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).' });
  }
  const doc = await BloodRequest.create({ patientName, bloodGroup, hospital, contactNumber: cleanPhone(contactNumber), district });
  res.status(201).json({ message: `Emergency request for ${bloodGroup} blood posted.`, request: { _id: doc._id } });
});

router.patch('/:id/fulfill', requireAuth, async (req, res) => {
  const doc = await BloodRequest.findByIdAndUpdate(req.params.id, { status: 'Fulfilled' }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Request not found.' });
  res.json({ ok: true });
});

module.exports = router;
