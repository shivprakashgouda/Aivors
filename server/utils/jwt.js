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
  const timestamp = new Date().toISOString();
  const token = req.cookies?.access_token || req.cookies?.__session || req.cookies?.token; // support legacy name
  
  // Enhanced debug logging
  console.log(`\n🔐 [${timestamp}] ========== AUTH GUARD ==========`);
  console.log('Request:', {
    method: req.method,
    path: req.path,
    url: req.url,
    origin: req.get('origin'),
    referer: req.get('referer'),
    host: req.get('host'),
    'user-agent': req.get('user-agent')?.substring(0, 50) + '...',
  });
  console.log('Cookies:', {
    hasAccessToken: !!req.cookies?.access_token,
    hasSession: !!req.cookies?.__session,
    hasToken: !!req.cookies?.token,
    hasRefreshToken: !!req.cookies?.refresh_token,
    allCookieNames: Object.keys(req.cookies || {}),
    cookieCount: Object.keys(req.cookies || {}).length,
    rawCookieHeader: req.get('cookie') ? 'Present' : 'Missing',
  });
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    trustProxy: req.app.get('trust proxy'),
    protocol: req.protocol,
    secure: req.secure,
  });
  
  if (!token) {
    console.log('❌ AUTH FAILED: No token found in cookies');
    console.log('   → Cookie header:', req.get('cookie') || 'MISSING');
    console.log('   → Has refresh_token:', !!req.cookies?.refresh_token ? '✅ YES - Call /api/auth/refresh' : '❌ NO');
    console.log('   → Possible causes:');
    console.log('     1. Access token expired → Solution: Frontend should call /api/auth/refresh');
    console.log('     2. Cookie not sent by browser (domain/path mismatch)');
    console.log('     3. Cookie expired or cleared');
    console.log('     4. CORS credentials not enabled');
    console.log('     5. SameSite attribute blocking cookie');
    console.log('================================================\n');
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'No token provided',
      details: 'Authentication cookie missing. Please sign in again.',
      requiresAuth: true
    });
  }

  console.log('🔑 Token found, verifying...');
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    console.log('❌ AUTH FAILED: Token verification failed');
    console.log('   → Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('   → Possible causes:');
    console.log('     1. Token expired (TTL: 15 minutes)');
    console.log('     2. JWT_SECRET mismatch');
    console.log('     3. Token corrupted');
    console.log('================================================\n');
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token',
      details: 'Token validation failed. Please sign in again.',
      requiresAuth: true,
      tokenExpired: true
    });
  }

  console.log('✅ AUTH SUCCESS: Token verified');
  console.log('   → User ID:', decoded.userId);
  console.log('   → Role:', decoded.role);
  console.log('   → Token expiry:', new Date(decoded.exp * 1000).toISOString());
  console.log('================================================\n');
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
