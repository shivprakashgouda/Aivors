const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signAccessToken, signRefreshToken, verifyRefreshToken, authGuard } = require('../utils/jwt');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

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
      // If user exists but email not verified, resend OTP
      if (!existingUser.isEmailVerified) {
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        existingUser.emailVerificationOTP = otp;
        existingUser.otpExpiresAt = otpExpiry;
        await existingUser.save();

        // Send OTP email
        await sendOTPEmail(email, otp, name);

        return res.status(200).json({
          message: 'Account exists but not verified. New OTP sent to your email.',
          requiresVerification: true,
          email: email,
        });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create user with Free plan and default values
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'user',
      status: 'pending_payment',
      isEmailVerified: false,
      emailVerificationOTP: otp,
      otpExpiresAt: otpExpiry,
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

    // Send response immediately - don't wait for email
    res.status(201).json({
      message: 'Account created! Please check your email for the verification code.',
      requiresVerification: true,
      email: email,
    });

    // Send OTP email asynchronously (fire and forget - don't block response)
    sendOTPEmail(email, otp, name)
      .then(() => console.log('✅ OTP email sent to:', email))
      .catch(err => {
        console.error('❌ Failed to send OTP email:', err);
        console.log('⚠️  User can still verify via resend OTP');
      });

    // Create audit log asynchronously
    AuditLog.create({
      userId: user._id,
      eventType: 'USER_CREATED',
      payload: { email: user.email, name: user.name, verified: false },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(err => console.error('❌ Audit log error:', err));
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/verify-otp - Verify email with OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if OTP matches
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Check if OTP expired
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.otpExpiresAt = null;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if welcome email fails
    }

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'EMAIL_VERIFIED',
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    
    res.cookie('access_token', access, { ...cookieBase, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      message: 'Email verified successfully!',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// POST /api/auth/resend-otp - Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.otpExpiresAt = otpExpiry;
    await user.save();

    // Send response immediately
    res.json({
      message: 'New OTP sent to your email',
      email: email,
    });

    // Send OTP email asynchronously (fire and forget)
    sendOTPEmail(email, otp, user.name)
      .then(() => console.log('✅ Resend OTP email sent to:', email))
      .catch(err => console.error('❌ Failed to resend OTP email:', err));

    // Create audit log asynchronously
    AuditLog.create({
      userId: user._id,
      eventType: 'OTP_RESENT',
      payload: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(err => console.error('❌ Audit log error:', err));
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error during OTP resend' });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt:', { email, hasPassword: !!password, origin: req.get('origin') });

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', { email, userId: user._id });

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('❌ Email not verified:', email);
      return res.status(403).json({ 
        error: 'Please verify your email first',
        requiresVerification: true,
        email: email,
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password valid for:', email);

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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    
    console.log('🍪 Login: Setting cookies with config:', {
      ...cookieBase,
      nodeEnv: process.env.NODE_ENV,
      origin: req.get('origin'),
      userId: user._id.toString(),
    });
    
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Server error during refresh' });
  }
});

module.exports = router;
