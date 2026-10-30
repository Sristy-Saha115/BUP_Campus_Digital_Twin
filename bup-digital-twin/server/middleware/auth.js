const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev_only_secret_change_me';

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    secret(),
    { expiresIn: '7d' }
  );
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    return res.status(401).json({
      error: 'Session expired. Please log in again.'
    });
  }
}

// Allows requests without a token; identifies the user when a valid token exists.
function optionalAuth(req, res, next) {
  const token = readToken(req);

  if (token) {
    try {
      req.user = jwt.verify(token, secret());
    } catch {
      // Continue as logged out if the token is invalid.
    }
  }

  next();
}

// Allows one or more roles.
function requireRole(...roles) {
  return (req, res, next) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : res.status(403).json({
          error: 'You do not have permission to do this.'
        });
}

module.exports = {
  signToken,
  requireAuth,
  optionalAuth,
  requireRole
};