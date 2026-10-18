// Scholarships API  ->  mounted at /api/scholarships
//   Student : BUP + International
//   Faculty : International only (enforced here, not just hidden in the UI)
//   others  : 403
const router = require('express').Router();
const mongoose = require('mongoose');
const { Scholarship } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// Status is computed from the deadline, so "Open" turns into "Closed" by itself.
// Scholarships without a fixed date use statusManual (Open / Closed / Upcoming / Varies).
const statusOf = (s) => (s.deadline ? (s.deadline > new Date() ? 'Open' : 'Closed') : s.statusManual);
const view = (s) => ({ ...s.toObject(), status: statusOf(s) });
const scopeFor = (req) => (req.user.role === 'Faculty' ? { category: 'International' } : {});

router.use(requireAuth, requireRole('Student', 'Faculty'));

router.get('/', async (req, res) => {
  const list = await Scholarship.find(scopeFor(req)).sort('category order');
  res.json({ scholarships: list.map(view) });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Scholarship not found.' });
  const s = await Scholarship.findOne({ _id: req.params.id, ...scopeFor(req) });
  if (!s) return res.status(404).json({ error: 'Scholarship not found.' });
  res.json({ scholarship: view(s) });
});

module.exports = router;
