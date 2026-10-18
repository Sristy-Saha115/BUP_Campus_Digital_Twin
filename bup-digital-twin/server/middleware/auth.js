const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev_only_secret_change_me';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name }, secret(), { expiresIn: '7d' });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Sets req.user if a valid token is sent, but never blocks the request
function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try { req.user = jwt.verify(token, secret()); } catch { /* treat as logged out */ }
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) return next();
    res.status(403).json({ error: `Only ${role} accounts can do this.` });
  };
}

module.exports = { signToken, requireAuth, optionalAuth, requireRole };
