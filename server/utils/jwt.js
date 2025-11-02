const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_TOKEN_SECRET + '_refresh';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Sign tokens
const signAccessToken = (userId, role = 'user') =>
  jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

const signRefreshToken = (userId, role = 'user') =>
  jwt.sign({ userId, role, type: 'refresh' }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

// Verify tokens
const verifyAccessToken = (token) => {
  try { return jwt.verify(token, ACCESS_TOKEN_SECRET); } catch { return null; }
};

const verifyRefreshToken = (token) => {
  try { return jwt.verify(token, REFRESH_TOKEN_SECRET); } catch { return null; }
};

// Auth guard expects a valid access token in cookie
const authGuard = (req, res, next) => {
  const token = req.cookies?.access_token || req.cookies?.__session || req.cookies?.token; // support legacy name
  if (!token) return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });

  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });

  req.user = decoded; // { userId, role }
  next();
};

// Admin guard
const adminGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
  next();
};

module.exports = {
  // sign/verify
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  // middleware
  authGuard,
  adminGuard,
};
