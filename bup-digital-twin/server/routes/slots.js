const router = require('express').Router();
const { Faculty, SlotBooking } = require('../models');
const { requireAuth } = require('../middleware/auth');

const TIME_SLOTS = ['10:00 AM - 10:30 AM', '11:30 AM - 12:00 PM', '02:00 PM - 02:30 PM'];

router.get('/faculty', async (req, res) => {
  res.json({ faculty: await Faculty.find().sort('name'), timeSlots: TIME_SLOTS });
});

// Which time slots are already taken for a faculty member on a date
router.get('/availability', async (req, res) => {
  const { faculty, date } = req.query;
  if (!faculty || !date) return res.json({ taken: [] });
  const rows = await SlotBooking.find({ facultyName: faculty, date });
  res.json({ taken: rows.map((r) => r.timeSlot) });
});

router.get('/mine', requireAuth, async (req, res) => {
  res.json({ bookings: await SlotBooking.find({ student: req.user.id }).sort('-createdAt').limit(50) });
});

router.post('/', requireAuth, async (req, res) => {
  const { faculty, date, timeSlot, reason } = req.body;
  if (!faculty || !date || !timeSlot || !reason) return res.status(400).json({ error: 'All fields are required!' });
  if (!TIME_SLOTS.includes(timeSlot)) return res.status(400).json({ error: 'Invalid time slot.' });
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return res.status(400).json({ error: 'Please choose today or a future date.' });
  try {
    const booking = await SlotBooking.create({ student: req.user.id, facultyName: faculty, date, timeSlot, reason });
    res.status(201).json({ message: `Booked ${faculty} on ${date} (${timeSlot}).`, booking });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'That slot is already booked. Please pick another.' });
    throw e;
  }
});

module.exports = router;
