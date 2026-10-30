const router = require('express').Router();
const { Notification } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user.id }).sort('-createdAt').limit(20),
    Notification.countDocuments({ user: req.user.id, read: false }),
  ]);
  res.json({ notifications: items, unread });
});

router.post('/read-all', requireAuth, async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ ok: true });
});

module.exports = router;
