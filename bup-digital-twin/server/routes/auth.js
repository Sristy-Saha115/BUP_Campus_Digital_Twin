
const router = require('express').Router();
const bcrypt = require('bcryptjs');

const { User, Faculty } = require('../models');

const {
  signToken,
  requireAuth,
  ACCOUNT_ROLES
} = require('../middleware/auth');

const { adminEmail } = require('../config/ensureAdmin');

/* =========================================
   CONFIGURATION
========================================= */

// Faculty registration access code
const signupCode = () =>
  process.env.FACULTY_SIGNUP_CODE || '';

// Student ID: 8 to 12 digits
// Provisional range until BUP's complete ID policy is confirmed.
const STUDENT_ID_RE = /^\d{8,12}$/;

// BUP Student Email
const studentAddress = (studentId) =>
  `${studentId}@student.bup.edu.bd`;

// General email validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normalize email
const cleanEmailOf = (email) =>
  String(email || '').trim().toLowerCase();

// Dummy hash to reduce login timing differences
const DUMMY_HASH = bcrypt.hashSync(
  'not-a-real-password',
  10
);

/* =========================================
   PUBLIC USER INFORMATION
========================================= */

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,

  facultyProfile: user.facultyProfile || null,

  // Student-specific fields
  ...(user.role === 'Student'
    ? {
        studentId: user.studentId || null,
        approvalStatus: user.approvalStatus || 'Pending'
      }
    : {})
});

/* =========================================
   COMMON VALIDATION
========================================= */

function validateBasics({ name, email, password }) {
  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return 'Name, email and password are required.';
  }

  if (
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return 'Name, email and password are required.';
  }

  if (name.trim().length > 100) {
    return 'Name is too long.';
  }

  const cleanEmail = cleanEmailOf(email);

  if (
    cleanEmail.length > 254 ||
    !EMAIL_RE.test(cleanEmail)
  ) {
    return 'Please enter a valid email address.';
  }

  if (
    password.length < 8 ||
    password.length > 72
  ) {
    return 'Password must be between 8 and 72 characters.';
  }

  return null;
}

/* =========================================
   STUDENT VALIDATION
========================================= */

function validateStudent(studentId, email) {
  // Student ID must be a string containing only digits.
  if (typeof studentId !== 'string') {
    return {
      valid: false,
      error: 'Student ID is required.'
    };
  }

  const cleanId = studentId.trim();
  const cleanEmail = cleanEmailOf(email);

  // Check student ID format
  if (!STUDENT_ID_RE.test(cleanId)) {
    return {
      valid: false,
      error: 'Student ID must contain 8 to 12 digits.'
    };
  }

  // Email must exactly match the Student ID
  const expectedEmail = studentAddress(cleanId);

  if (cleanEmail !== expectedEmail) {
    return {
      valid: false,
      error:
        'BUP Student Email must match your Student ID. ' +
        `Expected email: ${expectedEmail}`
    };
  }

  return {
    valid: true,
    studentId: cleanId,
    email: cleanEmail
  };
}

/* =========================================
   FACULTY OPTIONS
========================================= */

router.get('/faculty-options', async (req, res) => {
  try {
    // Faculty profiles already linked to an account
    const claimed = await User.find({
      role: 'Faculty',
      facultyProfile: { $ne: null }
    }).distinct('facultyProfile');

    // Show only available Faculty profiles
    const list = await Faculty.find({
      _id: { $nin: claimed }
    }).sort('department name');

    res.json({
      faculty: list,
      codeRequired: Boolean(signupCode())
    });

  } catch (err) {
    console.error('Faculty options error:', err);

    res.status(500).json({
      error: 'Could not load faculty list.'
    });
  }
});

/* =========================================
   STUDENT REGISTRATION
========================================= */

// Students can register, but cannot log in
// until Admin approves their account.

router.post('/register', async (req, res) => {
  try {
    const body = req.body || {};

    // Validate basic registration fields
    const problem = validateBasics(body);

    if (problem) {
      return res.status(400).json({
        error: problem
      });
    }

    // Validate Student ID and BUP email
    const validation = validateStudent(
      body.studentId,
      body.email
    );

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const studentId = validation.studentId;
    const email = validation.email;

    // =====================================
    // PREVENT ADMIN EMAIL REGISTRATION
    // =====================================

    const fixedAdminEmail = cleanEmailOf(adminEmail());

    if (
      fixedAdminEmail &&
      email === fixedAdminEmail
    ) {
      return res.status(403).json({
        error:
          'This email cannot be used for Student registration.'
      });
    }

    // =====================================
    // PREVENT FACULTY EMAIL REGISTRATION
    // =====================================

    const facultyMember = await Faculty.findOne({
      email
    });

    if (facultyMember) {
      return res.status(403).json({
        error:
          'This email belongs to a Faculty member. ' +
          'Please use Faculty registration.'
      });
    }

    // =====================================
    // PREVENT DUPLICATE STUDENT ACCOUNTS
    // =====================================

    const existingUser = await User.findOne({
      $or: [
        { email },
        { studentId }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        error:
          'This Student ID or email is already registered.'
      });
    }

    // =====================================
    // HASH PASSWORD
    // =====================================

    const passwordHash = await bcrypt.hash(
      body.password,
      12
    );

    // =====================================
    // CREATE PENDING STUDENT
    // =====================================

    // The frontend cannot assign Faculty/Admin roles.
    // The backend always assigns Student here.

    await User.create({
      name: body.name.trim(),
      email,
      studentId,
      passwordHash,

      role: 'Student',
      facultyProfile: null,

      // Student cannot log in until approval
      approvalStatus: 'Pending'
    });

    // No JWT is issued during Student registration.
    return res.status(201).json({
      pendingApproval: true,
      message:
        'Registration submitted successfully. ' +
        'Your account is pending Admin approval.'
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error:
          'This Student ID or email is already registered.'
      });
    }

    console.error('Student registration error:', err);

    return res.status(500).json({
      error: 'Student registration failed.'
    });
  }
});

/* =========================================
   FACULTY REGISTRATION
========================================= */

// Existing Faculty authentication system.
// Faculty must select an available Faculty Directory
// profile and provide the access code when required.

router.post('/register-faculty', async (req, res) => {
  try {
    const body = req.body || {};

    const problem = validateBasics(body);

    if (problem) {
      return res.status(400).json({
        error: problem
      });
    }

    const {
      facultyCode,
      facultyId,
      code
    } = body;

    const cleanEmail = cleanEmailOf(body.email);

    // Check if email already exists
    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered!'
      });
    }

    // =====================================
    // VERIFY FACULTY ACCESS CODE
    // =====================================

    const requiredCode = signupCode();
    const submittedCode = facultyCode || code;

    if (
      requiredCode &&
      submittedCode !== requiredCode
    ) {
      return res.status(403).json({
        error: 'Invalid faculty access code.'
      });
    }

    // =====================================
    // FIND FACULTY DIRECTORY PROFILE
    // =====================================

    const member = facultyId
      ? await Faculty.findById(facultyId)
          .catch(() => null)
      : await Faculty.findOne({
          email: cleanEmail
        });

    if (!member) {
      return res.status(403).json({
        error:
          'Please select your name from the Faculty Directory ' +
          'or use your official Faculty email.'
      });
    }

    // The selected Faculty profile must match the email
    if (
      member.email &&
      member.email.toLowerCase().trim() !== cleanEmail
    ) {
      return res.status(403).json({
        error:
          'Please use your official Faculty email.'
      });
    }

    // Prevent duplicate Faculty profile registration
    const existingAccount = await User.findOne({
      role: 'Faculty',
      facultyProfile: member._id
    });

    if (existingAccount) {
      return res.status(409).json({
        error:
          'This Faculty member already has an account.'
      });
    }

    // =====================================
    // CREATE FACULTY ACCOUNT
    // =====================================

    const user = await User.create({
      name: body.name.trim(),
      email: cleanEmail,

      // Backend assigns Faculty role
      role: 'Faculty',

      facultyProfile: member._id,

      passwordHash: await bcrypt.hash(
        body.password,
        10
      )
    });

    // Faculty can log in after successful registration
    return res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Email already registered!'
      });
    }

    console.error('Faculty registration error:', err);

    return res.status(500).json({
      error: 'Faculty registration failed.'
    });
  }
});

/* =========================================
   NORMAL LOGIN
========================================= */

// Login uses the actual role stored in MongoDB.
// The frontend cannot change a user's role.

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Basic validation
    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const cleanEmail = cleanEmailOf(email);

    // Find user from MongoDB
    const user = cleanEmail
      ? await User.findOne({
          email: cleanEmail
        })
      : null;

    // Compare hashed password
    const passwordOk = await bcrypt.compare(
      password,
      user ? user.passwordHash : DUMMY_HASH
    );

    if (!user || !passwordOk) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    // =====================================
    // BLOCK UNAUTHORIZED ROLES
    // =====================================

    // Visitor and Staff accounts cannot log in
    if (!ACCOUNT_ROLES.includes(user.role)) {
      return res.status(403).json({
        error:
          'This account is not authorized to log in.'
      });
    }

    // =====================================
    // STUDENT APPROVAL CHECK
    // =====================================

    if (user.role === 'Student') {
      if (user.approvalStatus !== 'Approved') {
        if (user.approvalStatus === 'Rejected') {
          return res.status(403).json({
            error:
              'Your Student registration was rejected. ' +
              'Please contact the administrator.'
          });
        }

        return res.status(403).json({
          error:
            'Your Student account is pending Admin approval.'
        });
      }
    }

    // =====================================
    // ROLE INTEGRITY
    // =====================================

    // The actual role is taken from MongoDB.
    // The request body is never trusted for role assignment.

    const actualRole = user.role;

    if (
      !['Student', 'Faculty', 'Admin'].includes(actualRole)
    ) {
      return res.status(403).json({
        error:
          'This account does not have permission to log in.'
      });
    }

    // =====================================
    // SUCCESSFUL LOGIN
    // =====================================

    return res.json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      error: 'Login failed.'
    });
  }
});

/* =========================================
   FIXED ADMIN LOGIN
========================================= */

// Only the fixed Admin account configured in
// server/.env can use this endpoint.
//
// No Admin registration is allowed.

router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const fail = () =>
      res.status(401).json({
        error: 'Invalid admin email or password.'
      });

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return fail();
    }

    const cleanEmail = cleanEmailOf(email);
    const fixedAdminEmail = cleanEmailOf(adminEmail());

    // Only allow the configured Admin email
    if (
      !fixedAdminEmail ||
      cleanEmail !== fixedAdminEmail
    ) {
      return fail();
    }

    const user = await User.findOne({
      email: cleanEmail
    });

    const passwordOk = await bcrypt.compare(
      password,
      user ? user.passwordHash : DUMMY_HASH
    );

    if (
      !user ||
      !passwordOk ||
      user.role !== 'Admin'
    ) {
      return fail();
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {
    console.error('Admin login error:', err);

    return res.status(500).json({
      error: 'Admin login failed.'
    });
  }
});

/* =========================================
   GET CURRENT USER
========================================= */

// Requires a valid JWT.
// requireAuth must also reject unapproved Students.

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        error: 'Account not found.'
      });
    }

    // Prevent unapproved Student access
    if (
      user.role === 'Student' &&
      user.approvalStatus !== 'Approved'
    ) {
      return res.status(403).json({
        error:
          'Student account is not approved.'
      });
    }

    // Prevent unauthorized roles
    if (!ACCOUNT_ROLES.includes(user.role)) {
      return res.status(403).json({
        error:
          'This account is not authorized.'
      });
    }

    return res.json({
      user: publicUser(user)
    });

  } catch (err) {
    console.error('Current user error:', err);

    return res.status(500).json({
      error: 'Could not load account.'
    });
  }
});

module.exports = router;
