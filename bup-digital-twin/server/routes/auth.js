const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Faculty } = require('../models');
const { signToken, requireAuth } = require('../middleware/auth');
 
// If FACULTY_SIGNUP_CODE is set in server/.env, faculty must enter it to register.
// (Simple safeguard for a demo. For real use, add email or admin verification.)
const signupCode = () => ''; // no sign-up code: faculty pick their name from the list
 
const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role, facultyProfile: u.facultyProfile || null,
});
 
// Faculty members who do not have an account yet (for the registration dropdown)
router.get('/faculty-options', async (req, res) => {
  const claimed = await User.find({ role: 'Faculty', facultyProfile: { $ne: null } }).distinct('facultyProfile');
  const list = await Faculty.find({ _id: { $nin: claimed } }).sort('department name');
  res.json({ faculty: list, codeRequired: !!signupCode() });
});
 
router.post('/register', async (req, res) => {
  const { name, email, password, role, facultyId, code } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ error: 'Email already registered!' });
 
  const safeRole = ['Student', 'Faculty', 'Staff', 'Visitor'].includes(role) ? role : 'Student';
  let facultyProfile = null;
  if (safeRole === 'Faculty') {
    if (signupCode() && code !== signupCode()) return res.status(403).json({ error: 'Wrong faculty sign-up code.' });
    const fac = facultyId && (await Faculty.findById(facultyId).catch(() => null));
    if (!fac) return res.status(400).json({ error: 'Please select your name from the faculty list.' });
    if (await User.findOne({ facultyProfile: fac._id })) return res.status(400).json({ error: 'This faculty member already has an account.' });
    facultyProfile = fac._id;
  }
  const user = await User.create({
    name, email, role: safeRole, facultyProfile, passwordHash: await bcrypt.hash(password, 10),
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});
 
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: email.toLowerCase() }));
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