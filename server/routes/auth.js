const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signAccessToken, signRefreshToken, verifyRefreshToken, authGuard } = require('../utils/jwt');

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with Free plan and default values
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'user',
      status: 'pending_payment',
      subscription: {
        plan: 'Free',
        status: 'inactive',
        minutesPurchased: 0,
        minutesRemaining: 0,
      },
      business: {
        setupStatus: 'incomplete',
        aiTrainingStatus: 'incomplete',
        posIntegration: 'incomplete',
        phoneNumber: 'Not Active',
      },
      analytics: {
        callsToday: 0,
        callsChangePercent: 0,
        aiStatus: 'Offline',
        responseTime: 0,
      },
      recentActivity: [],
    });

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'USER_CREATED',
      payload: { email: user.email, name: user.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate tokens and set cookies
    const access = signAccessToken(user._id.toString(), user.role);
    const refresh = signRefreshToken(user._id.toString(), user.role);
    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
    res.cookie('access_token', access, { ...cookieBase, maxAge: 15 * 60 * 1000 }); // 15m
    res.cookie('refresh_token', refresh, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d

    res.status(201).json({
      message: 'User created successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'USER_LOGIN',
      payload: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate tokens and set cookies
    const access = signAccessToken(user._id.toString(), user.role);
    const refresh = signRefreshToken(user._id.toString(), user.role);
    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
    res.cookie('access_token', access, { ...cookieBase, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      message: 'Login successful',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', authGuard, async (req, res) => {
  try {
    // Create audit log
    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'USER_LOGOUT',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authGuard, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/refresh - rotate access token using refresh cookie
router.post('/refresh', async (req, res) => {
  try {
    const refresh = req.cookies?.refresh_token;
    if (!refresh) return res.status(401).json({ error: 'Unauthorized', message: 'No refresh token' });

    const decoded = verifyRefreshToken(refresh);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const access = signAccessToken(user._id.toString(), user.role);
    res.cookie('access_token', access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Server error during refresh' });
  }
});

module.exports = router;
