const router = require('express').Router();
const mongoose = require('mongoose');
const { Faculty, SlotBooking, User, FacultyAvailability } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const TIME_SLOTS = ['10:00 AM - 10:30 AM', '11:30 AM - 12:00 PM', '02:00 PM - 02:30 PM'];
const STATUSES = ['Pending', 'Accepted', 'Cancelled', 'Completed'];
const STUDENT_FIELDS = 'name email role';

// Today's date in Bangladesh time, as YYYY-MM-DD
const todayDhaka = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

// A real calendar date in YYYY-MM-DD form (rejects things like 2026-02-31)
const isValidDate = (d) => {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const parsed = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d;
};

// The Faculty record of the logged-in faculty user (matched by email)
async function facultyOf(userId) {
  const user = await User.findById(userId);
  return user ? Faculty.findOne({ email: user.email }) : null;
}

// For faculty-only routes: attaches req.faculty, or stops with 403 if the account is not linked.
// (3-argument middleware is not wrapped by server.js, so it passes its own errors to next.)
async function requireFacultyProfile(req, res, next) {
  try {
    const fac = await facultyOf(req.user.id);
    if (!fac) {
      return res.status(403).json({ error: 'Your account is not linked to the faculty directory. Please register with your official faculty email.' });
    }
    req.faculty = fac;
    return next();
  } catch (e) {
    return next(e);
  }
}
const facultyOnly = [requireAuth, requireRole('Faculty'), requireFacultyProfile];

const byDateThenSlot = (a, b) =>
  a.date.localeCompare(b.date) || TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot);

const findBooking = async (id) => (mongoose.isValidObjectId(id) ? SlotBooking.findById(id) : null);

// Live counts straight from the database (never derived from a filtered list)
async function statusCounts(facultyId) {
  const [all, ...each] = await Promise.all([
    SlotBooking.countDocuments({ faculty: facultyId }),
    ...STATUSES.map((status) => SlotBooking.countDocuments({ faculty: facultyId, status })),
  ]);
  return { All: all, ...Object.fromEntries(STATUSES.map((s, i) => [s, each[i]])) };
}

// Which slots a faculty member offers on a date.
// Until a member adds availability, every standard slot is offered (the original behaviour).
// After that, only the slots they listed are offered.
async function offeredSlots(member, date) {
  if (!member.availabilitySet) return { restricted: false, offered: TIME_SLOTS };
  const rows = await FacultyAvailability.find({ faculty: member._id, date });
  const listed = new Set(rows.map((r) => r.timeSlot));
  return { restricted: true, offered: TIME_SLOTS.filter((s) => listed.has(s)) };
}

/* ------------------------------------------------------------------ public */

router.get('/faculty', async (req, res) => {
  res.json({ faculty: await Faculty.find().sort('order'), timeSlots: TIME_SLOTS });
});

// Slots on a date that are already held (Pending or Accepted), and the slots the member offers
router.get('/availability', async (req, res) => {
  const { faculty, date } = req.query;
  if (!faculty || !date) return res.json({ taken: [], offered: [], restricted: false });
  const member = await Faculty.findOne({ name: String(faculty) });
  if (!member) return res.json({ taken: [], offered: [], restricted: false });
  const rows = await SlotBooking.find({ faculty: member._id, date: String(date), active: true });
  const { restricted, offered } = await offeredSlots(member, String(date));
  res.json({ taken: rows.map((r) => r.timeSlot), offered, restricted });
});

// Upcoming dates that still have at least one free slot (only meaningful once availability is set)
router.get('/availability/dates', async (req, res) => {
  const member = req.query.faculty ? await Faculty.findOne({ name: String(req.query.faculty) }) : null;
  if (!member || !member.availabilitySet) return res.json({ restricted: false, dates: [] });
  const today = todayDhaka();
  const [listed, booked] = await Promise.all([
    FacultyAvailability.find({ faculty: member._id, date: { $gte: today } }),
    SlotBooking.find({ faculty: member._id, date: { $gte: today }, active: true }),
  ]);
  const held = new Set(booked.map((b) => `${b.date}|${b.timeSlot}`));
  const dates = [...new Set(listed.filter((r) => !held.has(`${r.date}|${r.timeSlot}`)).map((r) => r.date))].sort();
  res.json({ restricted: true, dates });
});

/* ----------------------------------------------------------------- student */

// Student: my own bookings (current and history; the page splits them by status)
router.get('/mine', requireAuth, async (req, res) => {
  res.json({ bookings: await SlotBooking.find({ student: req.user.id }).sort('-createdAt').limit(200) });
});

// Student: request a booking (status starts as Pending; the slot is held immediately)
router.post('/', requireAuth, async (req, res) => {
  if (req.user.role === 'Faculty') return res.status(403).json({ error: 'Faculty accounts cannot book consultations.' });
  const { faculty, date, timeSlot, reason } = req.body;
  if (!faculty || !date || !timeSlot || !reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  if (!TIME_SLOTS.includes(timeSlot)) return res.status(400).json({ error: 'Invalid time slot.' });
  if (!isValidDate(date) || date < todayDhaka()) {
    return res.status(400).json({ error: 'Please choose today or a future date.' });
  }
  const member = await Faculty.findOne({ name: faculty });
  if (!member) return res.status(400).json({ error: 'Selected faculty member was not found.' });

  // The member must actually offer this slot (always true until they set availability)
  const { offered } = await offeredSlots(member, date);
  if (!offered.includes(timeSlot)) {
    return res.status(400).json({ error: 'This faculty member is not available at the selected date and time.' });
  }

  // A student cannot hold two bookings at the same date and time
  const clash = await SlotBooking.findOne({ student: req.user.id, date, timeSlot, active: true });
  if (clash) return res.status(409).json({ error: 'You already have a booking at this date and time.' });

  try {
    const booking = await SlotBooking.create({
      student: req.user.id,
      faculty: member._id,
      facultyName: member.name,
      date,
      timeSlot,
      reason: String(reason).trim().slice(0, 300),
    });
    res.status(201).json({
      message: `Your request has been sent to ${member.name} for ${date} (${timeSlot}). You will receive a message once it is accepted.`,
      booking,
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'That slot is already booked. Please pick another.' });
    throw e;
  }
});

/* ----------------------------------------------------------------- faculty */

// Faculty: my profile (only what the faculty dataset holds: name and email)
router.get('/faculty/me', ...facultyOnly, async (req, res) => {
  res.json({ profile: { name: req.faculty.name, email: req.faculty.email } });
});

// Faculty: bookings made with me, optionally filtered by ?status=, plus live counts for every status
router.get('/faculty/bookings', ...facultyOnly, async (req, res) => {
  const fac = req.faculty;
  const status = String(req.query.status || 'All');
  if (status !== 'All' && !STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status filter.' });
  const filter = { faculty: fac._id };
  if (status !== 'All') filter.status = status;
  const [bookings, counts] = await Promise.all([
    SlotBooking.find(filter).populate('student', STUDENT_FIELDS),
    statusCounts(fac._id),
  ]);
  bookings.sort(byDateThenSlot);
  res.json({ faculty: { _id: fac._id, name: fac.name, email: fac.email }, bookings, counts });
});

// Faculty: my schedule = accepted consultations (upcoming, and past ones not yet marked done) and completed ones
router.get('/faculty/schedule', ...facultyOnly, async (req, res) => {
  const today = todayDhaka();
  const rows = await SlotBooking.find({
    faculty: req.faculty._id,
    status: { $in: ['Accepted', 'Completed'] },
  }).populate('student', STUDENT_FIELDS);
  rows.sort(byDateThenSlot);
  res.json({
    today,
    upcoming: rows.filter((b) => b.status === 'Accepted' && b.date >= today),
    awaiting: rows.filter((b) => b.status === 'Accepted' && b.date < today),
    completed: rows.filter((b) => b.status === 'Completed').reverse(),   // newest first
  });
});

// Faculty: my upcoming availability, each slot marked with any booking that holds it
router.get('/availability/mine', ...facultyOnly, async (req, res) => {
  const today = todayDhaka();
  const [listed, booked] = await Promise.all([
    FacultyAvailability.find({ faculty: req.faculty._id, date: { $gte: today } }),
    SlotBooking.find({ faculty: req.faculty._id, date: { $gte: today }, active: true }),
  ]);
  const bookingAt = new Map(booked.map((b) => [`${b.date}|${b.timeSlot}`, b.status]));
  const slots = listed
    .map((r) => ({ _id: r._id, date: r.date, timeSlot: r.timeSlot, booking: bookingAt.get(`${r.date}|${r.timeSlot}`) || null }))
    .sort(byDateThenSlot);
  res.json({ configured: Boolean(req.faculty.availabilitySet), timeSlots: TIME_SLOTS, slots });
});

// Faculty: offer one or more standard time slots on a date
router.post('/availability', ...facultyOnly, async (req, res) => {
  const { date, timeSlots } = req.body;
  if (!isValidDate(date) || date < todayDhaka()) {
    return res.status(400).json({ error: 'Please choose today or a future date.' });
  }
  const chosen = Array.isArray(timeSlots) ? [...new Set(timeSlots)] : [];
  if (chosen.length === 0) return res.status(400).json({ error: 'Please choose at least one time slot.' });
  if (!chosen.every((s) => TIME_SLOTS.includes(s))) return res.status(400).json({ error: 'Invalid time slot.' });

  let added = 0;
  for (const timeSlot of chosen) {
    if (await FacultyAvailability.findOne({ faculty: req.faculty._id, date, timeSlot })) continue;
    try {
      await FacultyAvailability.create({ faculty: req.faculty._id, date, timeSlot });
      added += 1;
    } catch (e) {
      if (e.code !== 11000) throw e;       // already added in the meantime: fine
    }
  }
  if (!req.faculty.availabilitySet) await Faculty.updateOne({ _id: req.faculty._id }, { $set: { availabilitySet: true } });
  res.status(201).json({ added });
});

// Faculty: stop offering a slot. Refused while a Pending/Accepted booking holds it.
router.delete('/availability/:id', ...facultyOnly, async (req, res) => {
  const row = mongoose.isValidObjectId(req.params.id) && (await FacultyAvailability.findById(req.params.id));
  if (!row) return res.status(404).json({ error: 'Availability slot not found.' });
  if (String(row.faculty) !== String(req.faculty._id)) {
    return res.status(403).json({ error: 'This slot belongs to another faculty member.' });
  }
  const held = await SlotBooking.findOne({ faculty: row.faculty, date: row.date, timeSlot: row.timeSlot, active: true });
  if (held) {
    const why = held.status === 'Accepted'
      ? 'This slot has an accepted booking. Cancel that booking first (with a reason), then remove the slot.'
      : held.status === 'Pending'
        ? 'This slot has a pending booking request. Accept or cancel the request first, then remove the slot.'
        : 'This slot already has a completed consultation and cannot be removed.';
    return res.status(409).json({ error: why });
  }
  await FacultyAvailability.deleteOne({ _id: row._id });
  res.json({ ok: true });
});

// Faculty: accept a pending booking
router.patch('/:id/accept', ...facultyOnly, async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (String(booking.faculty) !== String(req.faculty._id)) {
    return res.status(403).json({ error: 'This booking belongs to another faculty member.' });
  }
  if (booking.status !== 'Pending') return res.status(400).json({ error: 'Only pending bookings can be accepted.' });
  if (booking.date < todayDhaka()) return res.status(400).json({ error: 'This booking date has already passed.' });

  // Safety check: never two accepted bookings in the same slot
  const clash = await SlotBooking.findOne({
    _id: { $ne: booking._id }, faculty: booking.faculty, date: booking.date, timeSlot: booking.timeSlot, status: 'Accepted',
  });
  if (clash) return res.status(409).json({ error: 'Another booking is already accepted for this slot.' });

  booking.status = 'Accepted';
  booking.respondedAt = new Date();
  await booking.save();
  res.json({ booking });
});

// Faculty: mark an accepted consultation as completed (on or after its date)
router.patch('/:id/complete', ...facultyOnly, async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (String(booking.faculty) !== String(req.faculty._id)) {
    return res.status(403).json({ error: 'This booking belongs to another faculty member.' });
  }
  if (booking.status !== 'Accepted') return res.status(400).json({ error: 'Only accepted bookings can be marked as completed.' });
  if (booking.date > todayDhaka()) {
    return res.status(400).json({ error: 'This consultation is scheduled for a later date. It can be marked as completed on the day of the consultation.' });
  }
  booking.status = 'Completed';     // stays active: the slot remains used
  booking.completedAt = new Date();
  await booking.save();
  res.json({ booking });
});

/* ------------------------------------------------------ student or faculty */

// Cancel: the student (own booking) or the faculty member (own bookings). A reason is always required.
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  let by = null;
  if (String(booking.student) === String(req.user.id)) by = 'Student';
  else if (req.user.role === 'Faculty') {
    const fac = await facultyOf(req.user.id);
    if (fac && String(booking.faculty) === String(fac._id)) by = 'Faculty';
  }
  if (!by) return res.status(403).json({ error: 'You cannot cancel this booking.' });
  if (booking.status === 'Cancelled') return res.status(400).json({ error: 'This booking is already cancelled.' });
  if (booking.status === 'Completed') return res.status(400).json({ error: 'Completed bookings cannot be cancelled.' });

  const reason = String((req.body || {}).reason || '').trim().slice(0, 300);
  if (reason.length < 3) {
    return res.status(400).json({ error: 'Please give a reason for cancelling (at least 3 characters).' });
  }

  const now = new Date();
  booking.status = 'Cancelled';
  booking.active = false;          // frees the slot
  booking.cancelledBy = by;
  booking.cancelReason = reason;
  booking.cancelledAt = now;
  booking.respondedAt = now;
  await booking.save();
  res.json({ booking });
});

module.exports = router;
