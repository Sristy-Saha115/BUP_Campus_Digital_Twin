
const router = require('express').Router();
const mongoose = require('mongoose');
const { Scholarship } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// Automatically calculate scholarship status.
const statusOf = (s) =>
  s.deadline
    ? (s.deadline > new Date() ? 'Open' : 'Closed')
    : s.statusManual;

const view = (s) => ({
  ...s.toObject(),
  status: statusOf(s)
});

// Faculty can see international scholarships only.
const scopeFor = (req) =>
  req.user.role === 'Faculty'
    ? { category: 'International' }
    : {};

router.use(requireAuth, requireRole('Student', 'Faculty', 'Admin'));

router.get('/', async (req, res) => {
  const list = await Scholarship.find(scopeFor(req)).sort('category order');
  res.json({ scholarships: list.map(view) });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Scholarship not found.' });
  }

  const scholarship = await Scholarship.findOne({
    _id: req.params.id,
    ...scopeFor(req)
  });

  if (!scholarship) {
    return res.status(404).json({ error: 'Scholarship not found.' });
  }

  res.json({ scholarship: view(scholarship) });
});

module.exports = router;
