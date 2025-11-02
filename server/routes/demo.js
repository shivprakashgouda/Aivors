const express = require('express');
const { sendDemoBookingEmail, generateOTP, sendOTPEmail } = require('../utils/emailService');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Temporary storage for demo OTPs (in production, use Redis or database)
const demoOTPs = new Map();

// POST /api/demo/book - Submit demo booking request and send OTP
router.post('/book', async (req, res) => {
  try {
    const { fullName, phone, email, businessName, timeSlot, additionalInfo } = req.body;

    // Validation
    if (!fullName || !phone || !email || !businessName) {
      return res.status(400).json({ error: 'Name, phone, email, and business name are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP and demo data temporarily
    demoOTPs.set(email, {
      otp,
      expiresAt: otpExpiry,
      demoData: { fullName, phone, email, businessName, timeSlot, additionalInfo },
      verified: false,
    });

    // Clean up expired OTPs (simple cleanup)
    setTimeout(() => {
      const stored = demoOTPs.get(email);
      if (stored && !stored.verified) {
        demoOTPs.delete(email);
      }
    }, 10 * 60 * 1000);

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, fullName);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      demoOTPs.delete(email);
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please try again.' 
      });
    }

    res.json({
      success: true,
      message: 'Please check your email for the verification code.',
      requiresVerification: true,
      email: email,
    });
  } catch (error) {
    console.error('Demo booking error:', error);
    res.status(500).json({ error: 'Server error processing demo booking' });
  }
});

// POST /api/demo/verify-otp - Verify OTP and send demo booking email
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Get stored OTP data
    const stored = demoOTPs.get(email);
    if (!stored) {
      return res.status(400).json({ error: 'No verification request found. Please submit the form again.' });
    }

    // Check if OTP matches
    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Check if OTP expired
    if (stored.expiresAt < new Date()) {
      demoOTPs.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please submit the form again.' });
    }

    // Mark as verified
    stored.verified = true;

    // Send demo booking notification email to admin
    try {
      await sendDemoBookingEmail(stored.demoData);
    } catch (emailError) {
      console.error('Failed to send demo booking email:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send demo booking notification. Please try again.' 
      });
    }

    // Create audit log
    await AuditLog.create({
      eventType: 'DEMO_BOOKING_VERIFIED',
      payload: { 
        fullName: stored.demoData.fullName, 
        email: stored.demoData.email, 
        businessName: stored.demoData.businessName,
        timeSlot: stored.demoData.timeSlot || 'Not specified',
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Clean up
    demoOTPs.delete(email);

    res.json({
      success: true,
      message: 'Email verified! Your demo request has been submitted successfully.',
    });
  } catch (error) {
    console.error('Demo OTP verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// POST /api/demo/resend-otp - Resend OTP for demo booking
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get stored data
    const stored = demoOTPs.get(email);
    if (!stored) {
      return res.status(400).json({ error: 'No verification request found. Please submit the form again.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    stored.otp = otp;
    stored.expiresAt = otpExpiry;

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, stored.demoData.fullName);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please try again.' 
      });
    }

    res.json({
      success: true,
      message: 'New OTP sent to your email',
    });
  } catch (error) {
    console.error('Resend demo OTP error:', error);
    res.status(500).json({ error: 'Server error during OTP resend' });
  }
});

module.exports = router;
