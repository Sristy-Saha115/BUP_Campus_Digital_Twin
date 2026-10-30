
const router = require('express').Router();
const mongoose = require('mongoose');

const {
  Faculty,
  SlotBooking,
  User,
  FacultyAvailability
} = require('../models');

const { requireAuth, requireRole } = require('../middleware/auth');

const TIME_SLOTS = [
  '10:00 AM - 10:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM'
];

const STATUSES = [
  'Pending',
  'Accepted',
  'Cancelled',
  'Completed'
];

const STUDENT_FIELDS = 'name email role';

// Today's date in Bangladesh time
const todayDhaka = () =>
  new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Dhaka'
  });

// Validate date in YYYY-MM-DD format
const isValidDate = (d) => {
  if (
    typeof d !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(d)
  ) {
    return false;
  }

  const parsed = new Date(`${d}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === d
  );
};

// Find the Faculty profile of a logged-in user
async function facultyOf(userId) {
  const user = await User.findById(userId);

  return user
    ? Faculty.findOne({ email: user.email })
    : null;
}

// Verify the logged-in Faculty account
async function requireFacultyProfile(req, res, next) {
  try {
    const fac = await facultyOf(req.user.id);

    if (!fac) {
      return res.status(403).json({
        error:
          'Your account is not linked to the faculty directory. ' +
          'Please register with your official faculty email.'
      });
    }

    req.faculty = fac;
    return next();

  } catch (err) {
    return next(err);
  }
}

// Faculty-only middleware
const facultyOnly = [
  requireAuth,
  requireRole('Faculty'),
  requireFacultyProfile
];

// Sort bookings by date and time
const byDateThenSlot = (a, b) =>
  a.date.localeCompare(b.date) ||
  TIME_SLOTS.indexOf(a.timeSlot) -
    TIME_SLOTS.indexOf(b.timeSlot);

// Find a booking by its ID
const findBooking = async (id) =>
  mongoose.isValidObjectId(id)
    ? SlotBooking.findById(id)
    : null;

// Count Faculty booking statuses
async function statusCounts(facultyId) {
  const [all, ...each] = await Promise.all([
    SlotBooking.countDocuments({
      faculty: facultyId
    }),

    ...STATUSES.map((status) =>
      SlotBooking.countDocuments({
        faculty: facultyId,
        status
      })
    )
  ]);

  return {
    All: all,
    ...Object.fromEntries(
      STATUSES.map((s, i) => [s, each[i]])
    )
  };
}

// Check offered consultation slots
async function offeredSlots(member, date) {
  if (!member.availabilitySet) {
    return {
      restricted: false,
      offered: TIME_SLOTS
    };
  }

  const rows = await FacultyAvailability.find({
    faculty: member._id,
    date
  });

  const listed = new Set(
    rows.map((r) => r.timeSlot)
  );

  return {
    restricted: true,
    offered: TIME_SLOTS.filter((s) => listed.has(s))
  };
}

/* ================= PUBLIC ROUTES ================= */

// Faculty Directory - Automatically sorted A-Z
router.get('/faculty', async (req, res) => {
  const faculty = await Faculty.find().sort({ name: 1 });

  faculty.sort((a, b) =>
    a.name.localeCompare(b.name, 'en', {
      sensitivity: 'base'
    })
  );

  res.json({
    faculty,
    timeSlots: TIME_SLOTS
  });
});

// Check available consultation slots
router.get('/availability', async (req, res) => {
  const { faculty, date } = req.query;

  if (!faculty || !date) {
    return res.json({
      taken: [],
      offered: [],
      restricted: false
    });
  }

  const member = await Faculty.findOne({
    name: String(faculty)
  });

  if (!member) {
    return res.json({
      taken: [],
      offered: [],
      restricted: false
    });
  }

  const rows = await SlotBooking.find({
    faculty: member._id,
    date: String(date),
    active: true
  });

  const { restricted, offered } =
    await offeredSlots(member, String(date));

  res.json({
    taken: rows.map((r) => r.timeSlot),
    offered,
    restricted
  });
});

// Find dates with available consultation slots
router.get('/availability/dates', async (req, res) => {
  const member = req.query.faculty
    ? await Faculty.findOne({
        name: String(req.query.faculty)
      })
    : null;

  if (!member || !member.availabilitySet) {
    return res.json({
      restricted: false,
      dates: []
    });
  }

  const today = todayDhaka();

  const [listed, booked] = await Promise.all([
    FacultyAvailability.find({
      faculty: member._id,
      date: { $gte: today }
    }),

    SlotBooking.find({
      faculty: member._id,
      date: { $gte: today },
      active: true
    })
  ]);

  const held = new Set(
    booked.map((b) => `${b.date}|${b.timeSlot}`)
  );

  const dates = [
    ...new Set(
      listed
        .filter(
          (r) => !held.has(`${r.date}|${r.timeSlot}`)
        )
        .map((r) => r.date)
    )
  ].sort();

  res.json({
    restricted: true,
    dates
  });
});

/* ================= STUDENT ROUTES ================= */

// Student can view only their own bookings
router.get(
  '/mine',
  requireAuth,
  requireRole('Student'),
  async (req, res) => {
    const bookings = await SlotBooking.find({
      student: req.user.id
    })
      .sort('-createdAt')
      .limit(200);

    res.json({ bookings });
  }
);

// Only Students can book consultations
router.post(
  '/',
  requireAuth,
  requireRole('Student'),
  async (req, res) => {
    const { faculty, date, timeSlot, reason } = req.body;

    if (
      !faculty ||
      !date ||
      !timeSlot ||
      !reason ||
      !String(reason).trim()
    ) {
      return res.status(400).json({
        error: 'All fields are required!'
      });
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({
        error: 'Invalid time slot.'
      });
    }

    if (!isValidDate(date) || date < todayDhaka()) {
      return res.status(400).json({
        error: 'Please choose today or a future date.'
      });
    }

    const member = await Faculty.findOne({
      name: faculty
    });

    if (!member) {
      return res.status(400).json({
        error: 'Selected faculty member was not found.'
      });
    }

    const { offered } = await offeredSlots(member, date);

    if (!offered.includes(timeSlot)) {
      return res.status(400).json({
        error:
          'This faculty member is not available ' +
          'at the selected date and time.'
      });
    }

    // Prevent overlapping student bookings
    const clash = await SlotBooking.findOne({
      student: req.user.id,
      date,
      timeSlot,
      active: true
    });

    if (clash) {
      return res.status(409).json({
        error:
          'You already have a booking at this date and time.'
      });
    }

    try {
      const booking = await SlotBooking.create({
        student: req.user.id,
        faculty: member._id,
        facultyName: member.name,
        date,
        timeSlot,
        reason: String(reason).trim().slice(0, 300)
      });

      res.status(201).json({
        message:
          `Your request has been sent to ${member.name} ` +
          `for ${date} (${timeSlot}). ` +
          'You will receive a message once it is accepted.',
        booking
      });

    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          error:
            'That slot is already booked. Please pick another.'
        });
      }

      throw err;
    }
  }
);

/* ================= FACULTY ROUTES ================= */

// Faculty profile
router.get(
  '/faculty/me',
  ...facultyOnly,
  async (req, res) => {
    res.json({
      profile: {
        name: req.faculty.name,
        email: req.faculty.email
      }
    });
  }
);

// Faculty can view their own bookings
router.get(
  '/faculty/bookings',
  ...facultyOnly,
  async (req, res) => {
    const fac = req.faculty;
    const status = String(req.query.status || 'All');

    if (
      status !== 'All' &&
      !STATUSES.includes(status)
    ) {
      return res.status(400).json({
        error: 'Unknown status filter.'
      });
    }

    const filter = {
      faculty: fac._id
    };

    if (status !== 'All') {
      filter.status = status;
    }

    const [bookings, counts] = await Promise.all([
      SlotBooking.find(filter).populate(
        'student',
        STUDENT_FIELDS
      ),

      statusCounts(fac._id)
    ]);

    bookings.sort(byDateThenSlot);

    res.json({
      faculty: {
        _id: fac._id,
        name: fac.name,
        email: fac.email
      },
      bookings,
      counts
    });
  }
);

// Faculty consultation schedule
router.get(
  '/faculty/schedule',
  ...facultyOnly,
  async (req, res) => {
    const today = todayDhaka();

    const rows = await SlotBooking.find({
      faculty: req.faculty._id,
      status: {
        $in: ['Accepted', 'Completed']
      }
    }).populate('student', STUDENT_FIELDS);

    rows.sort(byDateThenSlot);

    res.json({
      today,
      upcoming: rows.filter(
        (b) =>
          b.status === 'Accepted' &&
          b.date >= today
      ),

      awaiting: rows.filter(
        (b) =>
          b.status === 'Accepted' &&
          b.date < today
      ),

      completed: rows
        .filter((b) => b.status === 'Completed')
        .reverse()
    });
  }
);

// Faculty can view their availability
router.get(
  '/availability/mine',
  ...facultyOnly,
  async (req, res) => {
    const today = todayDhaka();

    const [listed, booked] = await Promise.all([
      FacultyAvailability.find({
        faculty: req.faculty._id,
        date: { $gte: today }
      }),

      SlotBooking.find({
        faculty: req.faculty._id,
        date: { $gte: today },
        active: true
      })
    ]);

    const bookingAt = new Map(
      booked.map((b) => [
        `${b.date}|${b.timeSlot}`,
        b.status
      ])
    );

    const slots = listed
      .map((r) => ({
        _id: r._id,
        date: r.date,
        timeSlot: r.timeSlot,
        booking:
          bookingAt.get(`${r.date}|${r.timeSlot}`) || null
      }))
      .sort(byDateThenSlot);

    res.json({
      configured: Boolean(
        req.faculty.availabilitySet
      ),
      timeSlots: TIME_SLOTS,
      slots
    });
  }
);

// Faculty can add availability
router.post(
  '/availability',
  ...facultyOnly,
  async (req, res) => {
    const { date, timeSlots } = req.body;

    if (!isValidDate(date) || date < todayDhaka()) {
      return res.status(400).json({
        error: 'Please choose today or a future date.'
      });
    }

    const chosen = Array.isArray(timeSlots)
      ? [...new Set(timeSlots)]
      : [];

    if (chosen.length === 0) {
      return res.status(400).json({
        error: 'Please choose at least one time slot.'
      });
    }

    if (
      !chosen.every((s) => TIME_SLOTS.includes(s))
    ) {
      return res.status(400).json({
        error: 'Invalid time slot.'
      });
    }

    let added = 0;

    for (const timeSlot of chosen) {
      const exists = await FacultyAvailability.findOne({
        faculty: req.faculty._id,
        date,
        timeSlot
      });

      if (exists) continue;

      try {
        await FacultyAvailability.create({
          faculty: req.faculty._id,
          date,
          timeSlot
        });

        added += 1;

      } catch (err) {
        if (err.code !== 11000) {
          throw err;
        }
      }
    }

    if (!req.faculty.availabilitySet) {
      await Faculty.updateOne(
        { _id: req.faculty._id },
        {
          $set: {
            availabilitySet: true
          }
        }
      );
    }

    res.status(201).json({ added });
  }
);

// Faculty can remove availability if no booking holds it
router.delete(
  '/availability/:id',
  ...facultyOnly,
  async (req, res) => {
    const row = mongoose.isValidObjectId(req.params.id)
      ? await FacultyAvailability.findById(req.params.id)
      : null;

    if (!row) {
      return res.status(404).json({
        error: 'Availability slot not found.'
      });
    }

    if (
      String(row.faculty) !==
      String(req.faculty._id)
    ) {
      return res.status(403).json({
        error:
          'This slot belongs to another faculty member.'
      });
    }

    const held = await SlotBooking.findOne({
      faculty: row.faculty,
      date: row.date,
      timeSlot: row.timeSlot,
      active: true
    });

    if (held) {
      const why =
        held.status === 'Accepted'
          ? 'This slot has an accepted booking. Cancel that booking first (with a reason), then remove the slot.'
          : held.status === 'Pending'
            ? 'This slot has a pending booking request. Accept or cancel the request first, then remove the slot.'
            : 'This slot already has a completed consultation and cannot be removed.';

      return res.status(409).json({
        error: why
      });
    }

    await FacultyAvailability.deleteOne({
      _id: row._id
    });

    res.json({ ok: true });
  }
);

// Faculty can accept pending consultations
router.patch(
  '/:id/accept',
  ...facultyOnly,
  async (req, res) => {
    const booking = await findBooking(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found.'
      });
    }

    if (
      String(booking.faculty) !==
      String(req.faculty._id)
    ) {
      return res.status(403).json({
        error:
          'This booking belongs to another faculty member.'
      });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        error:
          'Only pending bookings can be accepted.'
      });
    }

    if (booking.date < todayDhaka()) {
      return res.status(400).json({
        error:
          'This booking date has already passed.'
      });
    }

    const clash = await SlotBooking.findOne({
      _id: { $ne: booking._id },
      faculty: booking.faculty,
      date: booking.date,
      timeSlot: booking.timeSlot,
      status: 'Accepted'
    });

    if (clash) {
      return res.status(409).json({
        error:
          'Another booking is already accepted for this slot.'
      });
    }

    booking.status = 'Accepted';
    booking.respondedAt = new Date();

    await booking.save();

    res.json({ booking });
  }
);

// Faculty can mark consultations as completed
router.patch(
  '/:id/complete',
  ...facultyOnly,
  async (req, res) => {
    const booking = await findBooking(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found.'
      });
    }

    if (
      String(booking.faculty) !==
      String(req.faculty._id)
    ) {
      return res.status(403).json({
        error:
          'This booking belongs to another faculty member.'
      });
    }

    if (booking.status !== 'Accepted') {
      return res.status(400).json({
        error:
          'Only accepted bookings can be marked as completed.'
      });
    }

    if (booking.date > todayDhaka()) {
      return res.status(400).json({
        error:
          'This consultation is scheduled for a later date.'
      });
    }

    booking.status = 'Completed';
    booking.completedAt = new Date();

    await booking.save();

    res.json({ booking });
  }
);

/* ============ STUDENT / FACULTY CANCELLATION ============ */

// Only Student or Faculty can cancel consultations.
// Admin cannot cancel bookings.
router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('Student', 'Faculty'),
  async (req, res) => {
    const booking = await findBooking(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found.'
      });
    }

    let by = null;

    // Student can cancel only their own booking
    if (
      req.user.role === 'Student' &&
      String(booking.student) === String(req.user.id)
    ) {
      by = 'Student';
    }

    // Faculty can cancel only consultations assigned to them
    else if (req.user.role === 'Faculty') {
      const fac = await facultyOf(req.user.id);

      if (
        fac &&
        String(booking.faculty) === String(fac._id)
      ) {
        by = 'Faculty';
      }
    }

    if (!by) {
      return res.status(403).json({
        error:
          'You cannot cancel this booking.'
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        error:
          'This booking is already cancelled.'
      });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        error:
          'Completed bookings cannot be cancelled.'
      });
    }

    const reason = String(
      (req.body || {}).reason || ''
    ).trim().slice(0, 300);

    if (reason.length < 3) {
      return res.status(400).json({
        error:
          'Please give a reason for cancelling (at least 3 characters).'
      });
    }

    const now = new Date();

    booking.status = 'Cancelled';
    booking.active = false;
    booking.cancelledBy = by;
    booking.cancelReason = reason;
    booking.cancelledAt = now;
    booking.respondedAt = now;

    await booking.save();

    res.json({ booking });
  }
);

module.exports = router;
