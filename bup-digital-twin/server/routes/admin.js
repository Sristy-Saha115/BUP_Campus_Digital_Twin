
const router = require('express').Router();

const {
  User,
  Faculty,
  SlotBooking,
  FacultyAvailability,
  Donor,
  Notification,
  Club,
  ClubEvent,
  Scholarship
} = require('../models');

const { requireAuth, requireRole } = require('../middleware/auth');

// All routes are restricted to Admin.
router.use(requireAuth, requireRole('Admin'));

/* -------------------- HELPERS -------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

const BOOKING_STATUSES = [
  'Pending',
  'Accepted',
  'Confirmed',
  'Declined',
  'Cancelled',
  'Withdrawn',
  'Completed'
];

const isId = (id) => /^[0-9a-f]{24}$/i.test(String(id));

const text = (v, max = 100) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const escapeRegex = (s) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const searchRegex = (q) => {
  const s = text(q, 60);
  return s ? new RegExp(escapeRegex(s), 'i') : null;
};

const audit = (req, action) =>
  console.log(`[ADMIN] ${req.user.email} ${action}`);

const accountsOfFaculty = (f) =>
  User.find({
    role: 'Faculty',
    $or: [
      { facultyProfile: f._id },
      { email: f.email }
    ]
  });

/* -------------------- OVERVIEW -------------------- */

router.get('/stats', async (req, res) => {
  const [
    students,
    faculty,
    bookings,
    pending,
    directory,
    events,
    clubs,
    scholarships
  ] = await Promise.all([
    User.countDocuments({ role: 'Student' }),
    User.countDocuments({ role: 'Faculty' }),
    SlotBooking.countDocuments(),
    SlotBooking.countDocuments({ status: 'Pending' }),
    Faculty.countDocuments(),
    ClubEvent.countDocuments(),
    Club.countDocuments(),
    Scholarship.countDocuments()
  ]);

  res.json({
    stats: {
      students,
      faculty,
      bookings,
      pending,
      directory,
      events,
      clubs,
      scholarships
    }
  });
});

/* -------------------- USERS -------------------- */

router.get('/users', async (req, res) => {
  const filter = { role: { $ne: 'Admin' } };

  if (['Student', 'Faculty'].includes(req.query.role)) {
    filter.role = req.query.role;
  }

  const rx = searchRegex(req.query.q);

  if (rx) {
    filter.$or = [
      { name: rx },
      { email: rx }
    ];
  }

  const rows = await User.find(filter)
    .sort('-createdAt')
    .limit(200);

  res.json({
    users: rows.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }))
  });
});

router.delete('/users/:id', async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(404).json({
      error: 'User not found.'
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found.'
    });
  }

  if (String(user._id) === req.user.id) {
    return res.status(400).json({
      error: 'You cannot delete your own account.'
    });
  }

  if (user.role === 'Admin') {
    return res.status(403).json({
      error: 'The admin account cannot be deleted.'
    });
  }

  // Admin cannot cancel consultation bookings.
  // Block deletion if the user has active consultations.
  const bookingFilter = {
    status: { $in: ['Pending', 'Accepted'] }
  };

  if (user.role === 'Student') {
    bookingFilter.student = user._id;
  } else if (user.role === 'Faculty') {
    bookingFilter.faculty = user.facultyProfile;
  }

  if (
    (user.role === 'Student' || user.role === 'Faculty') &&
    await SlotBooking.countDocuments(bookingFilter)
  ) {
    return res.status(409).json({
      error:
        'This user has active consultations. ' +
        'The student or faculty must resolve them first.'
    });
  }

  await Promise.all([
    Donor.deleteMany({ user: user._id }),
    Notification.deleteMany({ user: user._id }),
    user.deleteOne()
  ]);

  audit(req, `deleted user ${user.email} (${user.role})`);

  res.json({ ok: true });
});

/* -------------------- FACULTY DIRECTORY -------------------- */

// The Order field is removed from the Admin Faculty form.

function readFacultyForm(body, partial) {
  const b = body || {};
  const data = {};

  if (!partial || b.name !== undefined) {
    data.name = text(b.name);

    if (!data.name) {
      return { error: 'Faculty name is required.' };
    }
  }

  if (!partial || b.email !== undefined) {
    data.email = text(b.email, 254).toLowerCase();

    if (!EMAIL_RE.test(data.email)) {
      return {
        error: 'Please enter a valid email address.'
      };
    }
  }

  if (b.category !== undefined || !partial) {
    data.category =
      b.category === undefined ? 'Regular' : b.category;

    if (!['Regular', 'Adjunct'].includes(data.category)) {
      return {
        error: 'Category must be Regular or Adjunct.'
      };
    }
  }

  if (b.designation !== undefined) {
    data.designation = text(b.designation);
  }

  if (b.department !== undefined) {
    data.department = text(b.department);
  }

  return { data };
}

// Get faculty sorted alphabetically.
router.get('/faculty', async (req, res) => {
  const [list, accounts] = await Promise.all([
    Faculty.find().sort({ name: 1 }),
    User.find({ role: 'Faculty' })
  ]);

  const profiles = new Set(
    accounts.map((u) => String(u.facultyProfile))
  );

  const emails = new Set(
    accounts.map((u) => u.email)
  );

  const faculty = list.map((f) => ({
    id: String(f._id),
    name: f.name,
    email: f.email,
    category: f.category,
    designation: f.designation,
    department: f.department,
    hasAccount:
      profiles.has(String(f._id)) ||
      emails.has(f.email)
  }));

  // Case-insensitive A-Z sorting.
  faculty.sort((a, b) =>
    a.name.localeCompare(b.name, 'en', {
      sensitivity: 'base'
    })
  );

  res.json({ faculty });
});

// Add faculty.
router.post('/faculty', async (req, res) => {
  const { error, data } = readFacultyForm(req.body, false);

  if (error) {
    return res.status(400).json({ error });
  }

  const clash = await User.findOne({
    email: data.email
  });

  if (clash) {
    return res.status(409).json({
      error:
        `A ${clash.role} account already uses this email. ` +
        'Delete that account first or use another email.'
    });
  }

  try {
    const created = await Faculty.create(data);

    audit(req, `added faculty ${data.email}`);

    res.status(201).json({
      id: String(created._id)
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'This email is already in the Faculty Directory.'
      });
    }

    throw err;
  }
});

// Update faculty.
router.patch('/faculty/:id', async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(404).json({
      error: 'Faculty member not found.'
    });
  }

  const member = await Faculty.findById(req.params.id);

  if (!member) {
    return res.status(404).json({
      error: 'Faculty member not found.'
    });
  }

  const { error, data } = readFacultyForm(req.body, true);

  if (error) {
    return res.status(400).json({ error });
  }

  if (data.email && data.email !== member.email) {
    if ((await accountsOfFaculty(member)).length) {
      return res.status(409).json({
        error:
          'This faculty member already has an account, ' +
          'so the email cannot be changed.'
      });
    }

    if (await User.findOne({ email: data.email })) {
      return res.status(409).json({
        error: 'An account already uses this email.'
      });
    }
  }

  try {
    Object.assign(member, data);
    await member.save();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'This email is already in the Faculty Directory.'
      });
    }

    throw err;
  }

  if (data.name) {
    await SlotBooking.updateMany(
      { faculty: member._id },
      { facultyName: data.name }
    );
  }

  audit(req, `updated faculty ${member.email}`);

  res.json({ ok: true });
});

// Remove faculty.
router.delete('/faculty/:id', async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(404).json({
      error: 'Faculty member not found.'
    });
  }

  const member = await Faculty.findById(req.params.id);

  if (!member) {
    return res.status(404).json({
      error: 'Faculty member not found.'
    });
  }

  const open = await SlotBooking.countDocuments({
    faculty: member._id,
    status: { $in: ['Pending', 'Accepted'] }
  });

  if (open) {
    return res.status(409).json({
      error:
        `This faculty member has ${open} open booking(s). ` +
        'The student or faculty must resolve them before removal.'
    });
  }

  // Keep consultation history.
  // Remove linked account, availability and notifications.
  const accounts = await accountsOfFaculty(member);

  await Promise.all([
    FacultyAvailability.deleteMany({
      faculty: member._id
    }),
    ...accounts.map((a) =>
      Notification.deleteMany({ user: a._id })
    ),
    ...accounts.map((a) => a.deleteOne()),
    member.deleteOne()
  ]);

  audit(req, `deleted faculty ${member.email}`);

  res.json({ ok: true });
});

/* -------------------- CONSULTATION MONITORING -------------------- */

// Admin can only VIEW bookings.
// No create, accept, reject, complete or cancel endpoints.

router.get('/bookings', async (req, res) => {
  const filter = {};

  if (BOOKING_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const rx = searchRegex(req.query.q);

  if (rx) {
    const people = await User.find({
      $or: [
        { name: rx },
        { email: rx }
      ]
    });

    filter.$or = [
      { facultyName: rx },
      { reason: rx },
      { date: rx },
      {
        student: {
          $in: people.map((u) => u._id)
        }
      }
    ];
  }

  const rows = await SlotBooking.find(filter)
    .sort('-createdAt')
    .limit(200);

  const studentIds = [
    ...new Set(
      rows.map((b) => String(b.student))
    )
  ];

  const students = await User.find({
    _id: { $in: studentIds }
  });

  const byId = new Map(
    students.map((u) => [String(u._id), u])
  );

  const counts = {};

  await Promise.all(
    BOOKING_STATUSES.map(async (status) => {
      counts[status] = await SlotBooking.countDocuments({
        status
      });
    })
  );

  res.json({
    counts,
    bookings: rows.map((b) => {
      const student = byId.get(String(b.student));

      return {
        id: String(b._id),
        studentName: student
          ? student.name
          : b.studentName || '(deleted user)',
        studentEmail: student ? student.email : '',
        facultyName: b.facultyName,
        date: b.date,
        timeSlot: b.timeSlot,
        reason: b.reason,
        status: b.status,
        cancelReason: b.cancelReason || '',
        cancelledBy: b.cancelledBy || '',
        respondedAt: b.respondedAt || null,
        cancelledAt: b.cancelledAt || null,
        completedAt: b.completedAt || null,
        createdAt: b.createdAt
      };
    })
  });
});

/* -------------------- EVENTS -------------------- */

router.get('/events', async (req, res) => {
  const rows = await ClubEvent.find()
    .sort('-createdAt')
    .limit(300);

  res.json({
    events: rows.map((e) => ({
      id: String(e._id),
      clubName: e.clubName,
      title: e.title,
      date: e.date,
      venue: e.venue,
      registrationUrl: e.registrationUrl,
      details: e.details,
      createdAt: e.createdAt
    }))
  });
});

// Add event.
router.post('/events', async (req, res) => {
  const b = req.body || {};

  const clubName = text(b.clubName);
  const title = text(b.title, 150);
  const registrationUrl = text(b.registrationUrl, 500);

  if (!clubName || !title) {
    return res.status(400).json({
      error: 'Club name and event title are required.'
    });
  }

  if (registrationUrl && !URL_RE.test(registrationUrl)) {
    return res.status(400).json({
      error:
        'Registration URL must start with http:// or https://'
    });
  }

  const created = await ClubEvent.create({
    clubName,
    title,
    date: text(b.date, 40),
    venue: text(b.venue, 150),
    registrationUrl,
    details: text(b.details, 1000),
    createdBy: req.user.id
  });

  audit(req, `added event "${title}"`);

  res.status(201).json({
    id: String(created._id)
  });
});

// Remove event.
router.delete('/events/:id', async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(404).json({
      error: 'Event not found.'
    });
  }

  const event = await ClubEvent.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      error: 'Event not found.'
    });
  }

  await event.deleteOne();

  audit(req, `deleted event "${event.title}"`);

  res.json({ ok: true });
});

/* -------------------- CLUBS -------------------- */

const slugify = (name) =>
  name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') ||
  `club-${Date.now().toString(36)}`;

router.get('/clubs', async (req, res) => {
  const rows = await Club.find().sort('order name');

  res.json({
    clubs: rows.map((c) => ({
      id: String(c._id),
      name: c.name,
      url: c.url,
      category: c.category,
      description: c.description,
      order: c.order
    }))
  });
});

// Add club.
router.post('/clubs', async (req, res) => {
  const b = req.body || {};

  const name = text(b.name);
  const url = text(b.url, 500);
  const icon = text(b.icon, 40) || 'fa-people-group';

  if (!name) {
    return res.status(400).json({
      error: 'Club name is required.'
    });
  }

  if (!URL_RE.test(url)) {
    return res.status(400).json({
      error:
        'Club page URL must start with http:// or https://'
    });
  }

  if (!/^fa-[a-z0-9-]+$/.test(icon)) {
    return res.status(400).json({
      error: 'Icon must look like fa-people-group.'
    });
  }

  let order = 99;

  if (b.order !== undefined && b.order !== '') {
    order = Number(b.order);

    if (!Number.isInteger(order) || order < 0 || order > 999) {
      return res.status(400).json({
        error:
          'Order must be a whole number from 0 to 999.'
      });
    }
  }

  const base = slugify(name);
  let slug = base;

  for (
    let n = 2;
    await Club.findOne({ slug });
    n += 1
  ) {
    slug = `${base}-${n}`;
  }

  const category = text(b.category) || 'Club';
  const description = text(b.description, 500);

  const created = await Club.create({
    name,
    slug,
    url,
    icon,
    order,
    category,
    description,
    categoryBn: category,
    descriptionBn: description
  });

  audit(req, `added club "${name}"`);

  res.status(201).json({
    id: String(created._id)
  });
});

// Remove club.
router.delete('/clubs/:id', async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(404).json({
      error: 'Club not found.'
    });
  }

  const club = await Club.findById(req.params.id);

  if (!club) {
    return res.status(404).json({
      error: 'Club not found.'
    });
  }

  // Existing club events are preserved.
  await club.deleteOne();

  audit(req, `deleted club "${club.name}"`);

  res.json({ ok: true });
});

/* -------------------- SCHOLARSHIPS -------------------- */

const SCHOLARSHIP_CATEGORIES = [
  'BUP',
  'International',
  'Government',
  'University'
];

const SCHOLARSHIP_STATUSES = [
  'Open',
  'Closed',
  'Upcoming',
  'Varies'
];

const asList = (v) =>
  (
    Array.isArray(v)
      ? v
      : typeof v === 'string'
        ? v.split(/\r?\n|,/)
        : []
  )
    .map((x) => text(x, 200))
    .filter(Boolean)
    .slice(0, 30);

router.get('/scholarships', async (req, res) => {
  const rows = await Scholarship.find()
    .sort('category order');

  res.json({
    scholarships: rows.map((s) => ({
      id: String(s._id),
      category: s.category,
      title: s.title,
      provider: s.provider,
      amount: s.amount,
      country: s.country,
      deadline: s.deadline,
      statusManual: s.statusManual,
      order: s.order
    }))
  });
});

// Add scholarship.
router.post('/scholarships', async (req, res) => {
  const b = req.body || {};

  const title = text(b.title, 150);
  const applyUrl = text(b.applyUrl, 500);
  const statusManual = b.statusManual || 'Varies';

  if (!SCHOLARSHIP_CATEGORIES.includes(b.category)) {
    return res.status(400).json({
      error:
        `Category must be one of: ${SCHOLARSHIP_CATEGORIES.join(', ')}.`
    });
  }

  if (!title) {
    return res.status(400).json({
      error: 'Scholarship title is required.'
    });
  }

  if (!SCHOLARSHIP_STATUSES.includes(statusManual)) {
    return res.status(400).json({
      error: 'Invalid status.'
    });
  }

  if (applyUrl && !URL_RE.test(applyUrl)) {
    return res.status(400).json({
      error:
        'Apply URL must start with http:// or https://'
    });
  }

  const data = {
    category: b.category,
    title,
    type: text(b.type),
    provider: text(b.provider),
    amount: text(b.amount),
    country: text(b.country),
    countryCode: text(b.countryCode, 3).toLowerCase(),
    funding: text(b.funding, 300),
    fullyFunded: b.fullyFunded === true,
    deadlineNote: text(b.deadlineNote, 200),
    statusManual,
    eligibility: asList(b.eligibility),
    description: text(b.description, 1500),
    note: text(b.note, 500),
    sourceName: text(b.sourceName),
    lastVerified: new Date()
  };

  data.level = asList(b.level);
  data.levels = data.level;

  if (applyUrl) {
    data.applyUrl = applyUrl;
  }

  if (b.minCgpa !== undefined && b.minCgpa !== '') {
    const n = Number(b.minCgpa);

    if (!(n >= 0 && n <= 4)) {
      return res.status(400).json({
        error:
          'Minimum CGPA must be between 0 and 4.'
      });
    }

    data.minCgpa = n;
  } else if (b.category === 'BUP') {
    return res.status(400).json({
      error:
        'BUP scholarships need a minimum CGPA.'
    });
  }

  if (b.deadline) {
    const d = new Date(
      `${b.deadline}T23:59:00+06:00`
    );

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(String(b.deadline)) ||
      Number.isNaN(d.getTime())
    ) {
      return res.status(400).json({
        error:
          'Deadline must be a valid date (YYYY-MM-DD).'
      });
    }

    data.deadline = d;
  }

  if (b.order !== undefined && b.order !== '') {
    const n = Number(b.order);

    if (
      !Number.isInteger(n) ||
      n < 0 ||
      n > 999
    ) {
      return res.status(400).json({
        error:
          'Order must be a whole number from 0 to 999.'
      });
    }

    data.order = n;
  }

  const created = await Scholarship.create(data);

  audit(req, `added scholarship "${title}"`);

  res.status(201).json({
    id: String(created._id)
  });
});

// Remove scholarship.
router.delete('/scholarships/:id', async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(404).json({
      error: 'Scholarship not found.'
    });
  }

  const item = await Scholarship.findById(req.params.id);

  if (!item) {
    return res.status(404).json({
      error: 'Scholarship not found.'
    });
  }

  await item.deleteOne();

  audit(req, `deleted scholarship "${item.title}"`);

  res.json({ ok: true });
});

// STUDENT_APPROVAL_V1: only admins can review student registrations.
router.get('/pending-students', async (req, res) => {
  const students = await User.find({
    role: 'Student',
    approvalStatus: { $nin: ['Approved', 'Rejected'] }
  }).select('name email studentId approvalStatus createdAt').sort({ createdAt: -1 }).limit(300);
  res.json({ students: students.map((u) => ({
    id: String(u._id), name: u.name, email: u.email,
    studentId: u.studentId || '', createdAt: u.createdAt
  })) });
});

router.patch('/students/:id/approval', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Student not found.' });
  const status = (req.body || {}).status;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
  }
  const student = await User.findOne({ _id: req.params.id, role: 'Student' });
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  if (student.approvalStatus === 'Approved' || student.approvalStatus === 'Rejected') {
    return res.status(409).json({ error: 'This registration has already been reviewed.' });
  }
  // Admin must independently verify ID against an authorized student record.
  student.approvalStatus = status;
  student.approvalReviewedAt = new Date();
  student.approvalReviewedBy = req.user.id;
  await student.save();
  audit(req, `${status.toLowerCase()} student ${student.email}`);
  res.json({ ok: true, status });
});

module.exports = router;
