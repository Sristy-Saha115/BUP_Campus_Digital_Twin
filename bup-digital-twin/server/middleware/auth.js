const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev_only_secret_change_me';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name }, secret(), { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = { signToken, requireAuth };
