const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signAccessToken, signRefreshToken, verifyRefreshToken, authGuard } = require('../utils/jwt');
const { generateOTP, sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

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
  console.log('\n🔐 ========== OTP VERIFICATION REQUEST ==========');
  console.log('Email:', req.body.email);
  console.log('OTP:', req.body.otp);
  console.log('================================================\n');
  
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      console.log('❌ Missing email or OTP');
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user
    console.log('🔍 Looking up user:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ User found:', user._id);

    // Check if already verified
    if (user.isEmailVerified) {
      console.log('⚠️  Email already verified');
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if OTP matches
    console.log('🔑 Comparing OTP - Stored:', user.emailVerificationOTP, 'Provided:', otp);
    // Ensure both are strings for comparison
    const storedOTP = String(user.emailVerificationOTP || '');
    const providedOTP = String(otp || '');
    if (storedOTP !== providedOTP) {
      console.log('❌ OTP mismatch');
      return res.status(400).json({ error: 'Invalid OTP code' });
    }
    console.log('✅ OTP matches');

    // Check if OTP expired
    const now = new Date();
    const expiry = user.otpExpiresAt;
    console.log('⏰ Checking expiry - Now:', now, 'Expiry:', expiry);
    if (expiry < now) {
      console.log('❌ OTP expired');
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    console.log('✅ OTP not expired');

    // Mark email as verified
    console.log('📝 Marking email as verified...');
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.otpExpiresAt = null;
    await user.save();
    console.log('✅ User saved successfully');

    // Send welcome email (don't await - fire and forget)
    console.log('📧 Sending welcome email...');
    sendWelcomeEmail(email, user.name)
      .then(() => console.log('✅ Welcome email sent'))
      .catch(emailError => {
        console.error('⚠️  Welcome email failed (non-critical):', emailError.message);
      });

    // Create audit log (don't await - fire and forget)
    console.log('📋 Creating audit log...');
    AuditLog.create({
      userId: user._id,
      eventType: 'EMAIL_VERIFIED',
      payload: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(err => console.error('⚠️  Audit log error (non-critical):', err.message));

    // Generate tokens and set cookies
    console.log('🔐 Generating auth tokens...');
    const access = signAccessToken(user._id.toString(), user.role);
    const refresh = signRefreshToken(user._id.toString(), user.role);
    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    
    console.log('🍪 Setting cookies with config:', {
      ...cookieBase,
      nodeEnv: process.env.NODE_ENV,
      origin: req.get('origin'),
    });
    
    res.cookie('access_token', access, { ...cookieBase, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });

    console.log('✅ Sending success response');
    console.log('================================================\n');
    
    res.json({
      message: 'Email verified successfully!',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('\n❌ ========== OTP VERIFICATION ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==============================================\n');
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

// POST /api/auth/request-reset - Request password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent user enumeration
    // Even if user doesn't exist, we return success
    if (!user) {
      console.log(`⚠️  Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing (security best practice)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    console.log(`🔐 Password reset requested for: ${email}`);

    // Build reset link using APP_BASE_URL
    const baseUrl = (process.env.APP_BASE_URL || process.env.CLIENT_URL || 'https://www.aivors.com').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send reset email and wait for result
    const emailResult = await sendPasswordResetEmail(email, resetToken, user.name, resetLink);
    
    if (!emailResult.success) {
      console.error('❌ Failed to send password reset email:', emailResult.error);
      
      // If in test mode, provide the reset link in console
      if (emailResult.mode === 'test') {
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
        console.log('\n⚠️  ========== TEST MODE - RESET LINK ==========');
        console.log(`   Email: ${email}`);
        console.log(`   Reset Link: ${resetLink}`);
        console.log('   Copy this link to reset password manually');
        console.log('===============================================\n');
      }
      
      return res.status(500).json({ 
        error: 'Failed to send reset email. Please contact support or check server logs.',
        details: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
      });
    }

    console.log('✅ Password reset email sent to:', email);

    res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });

    // Log audit event
    await AuditLog.create({
      userId: user._id,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'password_reset_requested', email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(err => console.error('Audit log error:', err));

  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validation
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new password reset link.' 
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset fields
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);

    // Log audit event
    await AuditLog.create({
      userId: user._id,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'password_reset_completed', email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(err => console.error('Audit log error:', err));

    res.status(200).json({
      message: 'Password has been reset successfully. You can now login with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

module.exports = router;
