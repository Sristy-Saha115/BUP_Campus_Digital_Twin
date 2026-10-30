
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Faculty } = require('../models');
const { signToken, requireAuth } = require('../middleware/auth');

const signupCode = () => process.env.FACULTY_SIGNUP_CODE || '';

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  facultyProfile: u.facultyProfile || null
});

router.get('/faculty-options', async (req, res) => {
  try {
    const claimed = await User.find({
      role: 'Faculty',
      facultyProfile: { $ne: null }
    }).distinct('facultyProfile');

    const list = await Faculty.find({
      _id: { $nin: claimed }
    }).sort('department name');

    res.json({ faculty: list, codeRequired: !!signupCode() });
  } catch (err) {
    res.status(500).json({ error: 'Could not load faculty list.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, facultyCode, facultyId, code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters.'
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (await User.findOne({ email: cleanEmail })) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    const safeRole = ['Student', 'Faculty', 'Staff', 'Visitor'].includes(role)
      ? role
      : 'Student';

    let facultyProfile = null;

    if (safeRole === 'Faculty') {
      const requiredCode = signupCode();
      const submittedCode = facultyCode || code;

      if (requiredCode && submittedCode !== requiredCode) {
        return res.status(403).json({
          error: 'Invalid faculty access code.'
        });
      }

      const member = facultyId
        ? await Faculty.findById(facultyId).catch(() => null)
        : await Faculty.findOne({ email: cleanEmail });

      if (!member) {
        return res.status(403).json({
          error: 'Please select your name from the faculty list or use your official faculty email.'
        });
      }

      if (
        member.email &&
        member.email.toLowerCase().trim() !== cleanEmail
      ) {
        return res.status(403).json({
          error: 'Please use your official faculty email.'
        });
      }

      const existingAccount = await User.findOne({
        role: 'Faculty',
        facultyProfile: member._id
      });

      if (existingAccount) {
        return res.status(400).json({
          error: 'This faculty member already has an account.'
        });
      }

      facultyProfile = member._id;
    }

    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      role: safeRole,
      facultyProfile,
      passwordHash: await bcrypt.hash(password, 10)
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').toLowerCase().trim();
    const user = cleanEmail && await User.findOne({ email: cleanEmail });

    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Could not load account.' });
  }
});

module.exports = router;
