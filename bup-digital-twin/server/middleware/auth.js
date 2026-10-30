const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Roles that may use protected APIs. A "Visitor" is simply someone who is not logged in.
// Legacy 'Staff' / 'Visitor' accounts from older versions are deliberately NOT listed.
const ACCOUNT_ROLES = ['Student', 'Faculty', 'Admin'];

const secret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }
  return 'dev_only_secret_change_me';
};

// Call once at startup so a missing secret stops the server instead of failing on first login.
function assertAuthConfig() {
  secret();
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set. Using an insecure development secret.');
  }
}

function signToken(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role, name: user.name },
    secret(),
    { algorithm: 'HS256', expiresIn: user.role === 'Admin' ? '8h' : '7d' }
  );
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Verifies the token, then loads the account so the role always comes from the database
// (never from the token), and deleted or unsupported accounts are rejected.
async function resolveUser(req) {
  const token = readToken(req);
  if (!token) return { status: 401, error: 'Please log in first.' };

  let payload;
  try {
    payload = jwt.verify(token, secret(), { algorithms: ['HS256'] });
  } catch {
    return { status: 401, error: 'Session expired. Please log in again.' };
  }

  let user = null;
  try {
    user = await User.findById(payload.id);
  } catch {
    user = null; // malformed id inside a token
  }
  if (!user) return { status: 401, error: 'Account not found. Please log in again.' };

  if (!ACCOUNT_ROLES.includes(user.role)) {
    return { status: 403, error: 'This account type cannot use this service.' };
  }

  // STUDENT_APPROVAL_V1: also block previously issued JWTs for pending students.
  if (user.role === 'Student' && user.approvalStatus !== 'Approved') {
    return { status: 403, error: 'Student account is pending approval or was rejected.' };
  }

  return {
    user: { id: String(user._id), role: user.role, name: user.name, email: user.email }
  };
}

// 401 when there is no valid login, 403 when the account type is not supported.
async function requireAuth(req, res, next) {
  try {
    const result = await resolveUser(req);
    if (result.error) return res.status(result.status).json({ error: result.error });
    req.user = result.user;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Allows requests without a token; identifies the user when a valid token exists.
async function optionalAuth(req, res, next) {
  try {
    const result = await resolveUser(req);
    if (result.user) req.user = result.user;
  } catch {
    // Continue as a visitor if anything goes wrong.
  }
  next();
}

// Allows one or more roles. 401 if not logged in, 403 if the role is not allowed.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please log in first.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    return next();
  };
}

module.exports = {
  ACCOUNT_ROLES,
  assertAuthConfig,
  signToken,
  requireAuth,
  optionalAuth,
  requireRole
};
