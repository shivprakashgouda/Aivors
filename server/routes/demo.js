const express = require('express');
const { sendDemoBookingEmail } = require('../utils/emailService');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// POST /api/demo/book - Submit demo booking request
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

    // Send demo booking notification email
    try {
      await sendDemoBookingEmail({
        fullName,
        phone,
        email,
        businessName,
        timeSlot,
        additionalInfo,
      });
    } catch (emailError) {
      console.error('Failed to send demo booking email:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send demo booking notification. Please try again.' 
      });
    }

    // Create audit log
    await AuditLog.create({
      eventType: 'DEMO_BOOKING_SUBMITTED',
      payload: { 
        fullName, 
        email, 
        businessName,
        timeSlot: timeSlot || 'Not specified',
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Demo request received! We\'ll contact you shortly to confirm your booking.',
    });
  } catch (error) {
    console.error('Demo booking error:', error);
    res.status(500).json({ error: 'Server error processing demo booking' });
  }
});

module.exports = router;
