/**
 * Password Reset Routes
 * 
 * Endpoints:
 * - POST /api/auth/request-password-reset - Request password reset link
 * - POST /api/auth/reset-password - Reset password with token
 * 
 * Mount in index.js: app.use('/api/auth', require('./routes/authReset'));
 * 
 * Required environment variables:
 * - APP_BASE_URL: Frontend URL (e.g., https://www.aivors.com)
 * - RESEND_API_KEY: Resend API key for sending emails
 * - MONGO_URI: MongoDB connection string
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendMail } = require('../utils/email');

const router = express.Router();

/**
 * POST /api/auth/request-password-reset
 * Request a password reset link
 * 
 * Body: { email: string }
 * Returns: { ok: true } (always, to prevent email enumeration)
 */
router.post('/request-password-reset', async (req, res) => {
  // TODO: Add rate-limiting middleware to prevent abuse (e.g., express-rate-limit)
  
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // If user not found, return success anyway (security: don't reveal email existence)
    if (!user) {
      console.log(`⚠️  Password reset requested for non-existent email: ${email}`);
      return res.json({ ok: true });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000);
    await user.save();

    // Build reset link using APP_BASE_URL
    const baseUrl = (process.env.APP_BASE_URL || process.env.CLIENT_URL || 'https://www.aivors.com').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea; margin-top: 0;">Hi ${user.name}!</h2>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px; color: #667eea;">${resetLink}</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME || 'Aivors'}. All rights reserved.<br>
      This is an automated email, please do not reply.
    </p>
  </div>
</body>
</html>`;

    const emailText = `Hi ${user.name},\n\nWe received a request to reset your password.\n\nClick this link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request a password reset, please ignore this email.\n\n© ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME || 'Aivors'}`;

    // Send email
    await sendMail({
      to: email,
      subject: 'Reset your password',
      html: emailHtml,
      text: emailText,
    });

    console.log(`✅ Password reset email sent to: ${email}`);

    // Return success (always, even if user not found)
    return res.json({ ok: true });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
 * 
 * Body: { email: string, token: string, newPassword: string }
 * Returns: { ok: true }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Validate inputs
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user with valid token
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset fields
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`✅ Password reset successful for: ${email}`);

    // Optional: Send confirmation email
    try {
      const confirmationHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #667eea;">Password Changed Successfully</h2>
  <p>Hi ${user.name},</p>
  <p>Your password has been successfully changed. If you didn't make this change, please contact support immediately.</p>
  <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME || 'Aivors'}</p>
</body>
</html>`;

      await sendMail({
        to: email,
        subject: 'Password changed successfully',
        html: confirmationHtml,
      });
    } catch (emailError) {
      console.error('⚠️  Failed to send confirmation email:', emailError.message);
      // Don't fail the request if confirmation email fails
    }

    return res.json({ ok: true });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;
