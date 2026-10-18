const router = require('express').Router();
const { Faculty, SlotBooking, User, Notification } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const TIME_SLOTS = [
  '10:00 AM - 10:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '03:30 PM - 04:00 PM',
];
const todayStr = () => new Date().toISOString().slice(0, 10);
const notify = (user, message, link = '/faculty') => (user ? Notification.create({ user, message, link }) : null);

router.get('/faculty', async (req, res) => {
  res.json({ faculty: await Faculty.find().sort('department name'), timeSlots: TIME_SLOTS });
});

// Time slots already taken for a faculty member on a date
router.get('/availability', async (req, res) => {
  const { facultyId, date } = req.query;
  if (!facultyId || !date) return res.json({ taken: [] });
  const fac = await Faculty.findById(facultyId).catch(() => null);
  if (!fac) return res.json({ taken: [] });
  const rows = await SlotBooking.find({ facultyName: fac.name, date, active: true });
  res.json({ taken: rows.map((r) => r.timeSlot) });
});

// ---------- Student ----------
router.get('/mine', requireAuth, async (req, res) => {
  res.json({ bookings: await SlotBooking.find({ student: req.user.id }).sort('-createdAt').limit(100) });
});

router.post('/', requireAuth, async (req, res) => {
  if (req.user.role === 'Faculty') return res.status(403).json({ error: 'Faculty accounts cannot request consultations.' });
  const { facultyId, date, timeSlot, reason } = req.body;
  if (!facultyId || !date || !timeSlot || !String(reason || '').trim()) return res.status(400).json({ error: 'All fields are required!' });
  if (!TIME_SLOTS.includes(timeSlot)) return res.status(400).json({ error: 'Invalid time slot.' });
  if (date < todayStr()) return res.status(400).json({ error: 'Please choose today or a future date.' });
  const fac = await Faculty.findById(facultyId).catch(() => null);
  if (!fac) return res.status(400).json({ error: 'Faculty member not found.' });
  const student = await User.findById(req.user.id);
  try {
    const booking = await SlotBooking.create({
      student: req.user.id, studentName: student ? student.name : '',
      faculty: fac._id, facultyName: fac.name, date, timeSlot, reason: String(reason).trim().slice(0, 300),
    });
    // Tell the faculty member if they have an account
    const facUser = await User.findOne({ facultyProfile: fac._id });
    await notify(facUser && facUser._id, `New consultation request from ${booking.studentName || 'a student'} on ${date} (${timeSlot}).`);
    res.status(201).json({ message: `Request sent to ${fac.name} for ${date} (${timeSlot}). Waiting for confirmation.`, booking });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'That slot is already booked. Please pick another.' });
    throw e;
  }
});

// Student withdraws their own request
router.patch('/:id/withdraw', requireAuth, async (req, res) => {
  const b = await SlotBooking.findOne({ _id: req.params.id, student: req.user.id });
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  if (!b.active) return res.status(400).json({ error: 'This booking is already closed.' });
  b.status = 'Withdrawn'; b.active = false;
  await b.save();
  const facUser = b.faculty ? await User.findOne({ facultyProfile: b.faculty }) : null;
  await notify(facUser && facUser._id, `${b.studentName || 'A student'} withdrew the consultation on ${b.date} (${b.timeSlot}).`);
  res.json({ booking: b });
});

// ---------- Faculty ----------
async function facultyOf(req) {
  const user = await User.findById(req.user.id);
  return user && user.facultyProfile ? Faculty.findById(user.facultyProfile) : null;
}

router.get('/incoming', requireAuth, requireRole('Faculty'), async (req, res) => {
  const fac = await facultyOf(req);
  if (!fac) return res.json({ bookings: [], faculty: null });
  res.json({ bookings: await SlotBooking.find({ facultyName: fac.name }).sort('-date -createdAt').limit(200), faculty: fac });
});

// action: confirm | decline (a pending request) | cancel (a confirmed consultation)
router.patch('/:id/respond', requireAuth, requireRole('Faculty'), async (req, res) => {
  const fac = await facultyOf(req);
  if (!fac) return res.status(403).json({ error: 'Your account is not linked to a faculty profile.' });
  const b = await SlotBooking.findOne({ _id: req.params.id, facultyName: fac.name });
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  if (!b.active) return res.status(400).json({ error: 'This booking is already closed.' });
  const { action } = req.body;
  const note = String(req.body.note || '').trim().slice(0, 300);
  const when = `${b.date} (${b.timeSlot})`;
  let message;

  if (action === 'confirm') {
    if (b.status !== 'Pending') return res.status(400).json({ error: 'Only pending requests can be accepted.' });
    b.status = 'Confirmed'; b.note = note;
    message = `${fac.name} confirmed your consultation on ${when}.${note ? ' Note: ' + note : ''}`;
  } else if (action === 'decline' || action === 'cancel') {
    if (action === 'decline' && b.status !== 'Pending') return res.status(400).json({ error: 'Only pending requests can be declined.' });
    if (action === 'cancel' && b.status !== 'Confirmed') return res.status(400).json({ error: 'Only confirmed consultations can be cancelled.' });
    if (!note) return res.status(400).json({ error: 'Please write a short reason so the student knows why.' });
    b.status = action === 'decline' ? 'Declined' : 'Cancelled';
    b.active = false; b.note = note;
    message = `${fac.name} ${action === 'decline' ? 'could not accept' : 'cancelled'} your consultation on ${when}. Reason: ${note}`;
  } else {
    return res.status(400).json({ error: 'Unknown action.' });
  }
  await b.save();
  await notify(b.student, message);   // appears in the student's notification bell
  res.json({ booking: b });
});

module.exports = router;
