const router = require('express').Router();
const { Club, ClubEvent } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  res.json({ clubs: await Club.find().sort('order') });
});

router.get('/events', async (req, res) => {
  res.json({ events: await ClubEvent.find().sort('-createdAt').limit(100) });
});

router.post('/events', requireAuth, async (req, res) => {
  const { clubName, title, date, venue, registrationUrl, details } = req.body;
  if (!clubName || !title) return res.status(400).json({ error: 'Club name and event title are required.' });
  if (registrationUrl && !/^https?:\/\//i.test(registrationUrl)) {
    return res.status(400).json({ error: 'Registration URL must start with http:// or https://' });
  }
  const ev = await ClubEvent.create({ clubName, title, date, venue, registrationUrl, details, createdBy: req.user.id });
  res.status(201).json({ event: ev });
});

router.delete('/events/:id', requireAuth, async (req, res) => {
  const ev = await ClubEvent.findById(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  if (String(ev.createdBy) !== req.user.id && req.user.role !== 'Admin') return res.status(403).json({ error: 'Only the creator can delete this event.' });
  await ev.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
