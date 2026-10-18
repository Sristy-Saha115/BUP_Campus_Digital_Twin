const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Faculty } = require('../models');
const { signToken, requireAuth } = require('../middleware/auth');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', async (req, res) => {
  const { name, email, password, role, facultyCode } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const cleanEmail = String(email).toLowerCase().trim();
  if (await User.findOne({ email: cleanEmail })) return res.status(400).json({ error: 'Email already registered!' });
  const safeRole = ['Student', 'Faculty', 'Staff', 'Visitor'].includes(role) ? role : 'Student';

  if (safeRole === 'Faculty') {
    // Optional extra protection: set FACULTY_SIGNUP_CODE in server/.env
    const required = process.env.FACULTY_SIGNUP_CODE;
    if (required && facultyCode !== required) return res.status(403).json({ error: 'Invalid faculty access code.' });
    // The email must belong to someone in the faculty directory
    const member = await Faculty.findOne({ email: cleanEmail });
    if (!member) {
      return res.status(403).json({ error: 'This email is not in the BUP ICT faculty directory. Please use your official faculty email.' });
    }
  }

  const user = await User.create({ name, email: cleanEmail, role: safeRole, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: String(email).toLowerCase().trim() }));
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user: publicUser(user) });
});

module.exports = router;