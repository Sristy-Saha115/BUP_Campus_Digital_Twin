const router = require('express').Router();
const { BloodRequest } = require('../models');
const { requireAuth } = require('../middleware/auth');

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

router.get('/', async (req, res) => {
  const filter = { status: 'Open' };
  if (req.query.group) filter.bloodGroup = req.query.group;
  res.json({ requests: await BloodRequest.find(filter).sort('-createdAt').limit(50) });
});

router.post('/', async (req, res) => {
  const { patientName, bloodGroup, hospital, contactNumber, district } = req.body;
  if (!bloodGroup || !hospital || !contactNumber) return res.status(400).json({ error: 'Please fill all required blood request details.' });
  if (!BD_PHONE.test(String(contactNumber).replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).' });
  }
  try {
    const doc = await BloodRequest.create({ patientName, bloodGroup, hospital, contactNumber, district });
    res.status(201).json({ message: `Emergency request for ${bloodGroup} blood posted.`, request: doc });
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ error: 'Invalid blood group.' });
    throw e;
  }
});

router.patch('/:id/fulfill', requireAuth, async (req, res) => {
  const doc = await BloodRequest.findByIdAndUpdate(req.params.id, { status: 'Fulfilled' }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Request not found.' });
  res.json({ request: doc });
});

module.exports = router;
