const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const User = require('../models/User');

/**
 * POST /webhook/retell
 * 
 * Production-ready webhook to receive call data from Retell AI (directly or via n8n)
 * Resolves user email from phoneNumber and saves to MongoDB calls collection
 */
router.post('/retell', async (req, res) => {
  try {
    const {
      callId,
      phoneNumber,
      transcript,
      summary,
      durationSeconds,
      eventType,
      call_id, // Alternative field name
      phone_number, // Alternative field name
      duration_seconds, // Alternative field name
      event_type // Alternative field name
    } = req.body;

    // Normalize field names (support both camelCase and snake_case)
    const normalizedCallId = callId || call_id;
    const normalizedPhoneNumber = phoneNumber || phone_number;
    const normalizedDurationSeconds = durationSeconds || duration_seconds || 0;
    const normalizedEventType = eventType || event_type || 'call_completed';

    // Validate required fields
    if (!normalizedCallId || !normalizedPhoneNumber) {
      console.log('⚠️  [RETELL WEBHOOK] Missing required fields:', {
        callId: normalizedCallId,
        phoneNumber: normalizedPhoneNumber
      });
      // Return success to prevent retry storms
      return res.status(200).json({ 
        success: true, 
        message: 'Missing required fields, skipping',
        skipped: true 
      });
    }

    console.log(`\n📞 [RETELL WEBHOOK] Received call data:`);
    console.log(`   Call ID: ${normalizedCallId}`);
    console.log(`   Phone: ${normalizedPhoneNumber}`);
    console.log(`   Duration: ${normalizedDurationSeconds}s`);
    console.log(`   Event: ${normalizedEventType}`);

    // Check for duplicate callId (idempotency)
    const existingCall = await Call.findOne({ callId: normalizedCallId });
    if (existingCall) {
      console.log(`✅ [RETELL WEBHOOK] Call ${normalizedCallId} already processed (duplicate)`);
      return res.status(200).json({ 
        success: true, 
        message: 'Call already processed',
        duplicate: true 
      });
    }

    // Resolve user by phoneNumber (normalized matching)
    // Normalize: remove spaces, dashes, parentheses, compare last 10 digits
    const normalizedPhone = normalizedPhoneNumber.replace(/[\s\-()]/g, '');
    
    let user = await User.findOne({ 
      $or: [
        { 'business.phoneNumber': normalizedPhoneNumber },
        { 'business.phoneNumber': normalizedPhone },
        { phoneNumber: normalizedPhoneNumber },
        { phoneNumber: normalizedPhone }
      ]
    }).select('_id email');

    // If still not found, try partial match on last 10 digits as fallback
    if (!user && normalizedPhone.length >= 10) {
      const last10Digits = normalizedPhone.slice(-10);
      user = await User.findOne({
        $or: [
          { 'business.phoneNumber': { $regex: last10Digits + '$' } },
          { phoneNumber: { $regex: last10Digits + '$' } }
        ]
      }).select('_id email');
    }

    if (!user) {
      console.log(`⚠️  [RETELL WEBHOOK] No user found for phone: ${normalizedPhoneNumber}`);
      console.log(`   Tried: exact match, normalized, last 10 digits`);
      console.log(`   Skipping call insert for ${normalizedCallId}`);
      // Return success to prevent retry
      return res.status(200).json({ 
        success: true, 
        message: 'No user found for phone number, skipping',
        skipped: true,
        phoneNumber: normalizedPhoneNumber
      });
    }

    console.log(`✅ [RETELL WEBHOOK] User found: ${user.email} (ID: ${user._id})`);

    // Create call record with both userId and email
    const call = await Call.create({
      callId: normalizedCallId,
      userId: user._id.toString(),
      email: user.email,
      phoneNumber: normalizedPhoneNumber,
      summary: summary || '',
      transcript: transcript || '',
      durationSeconds: normalizedDurationSeconds,
      eventType: normalizedEventType,
      createdAt: new Date()
    });

    console.log(`✅ [RETELL WEBHOOK] Call saved to MongoDB:`);
    console.log(`   ID: ${call._id}`);
    console.log(`   UserId: ${call.userId}`);
    console.log(`   Email: ${call.email}`);
    console.log(`   CallId: ${call.callId}\n`);

    return res.status(200).json({ 
      success: true,
      message: 'Call data saved successfully',
      callId: normalizedCallId,
      email: user.email
    });

  } catch (error) {
    // Handle duplicate key error gracefully (race condition)
    if (error.code === 11000) {
      console.log(`✅ [RETELL WEBHOOK] Duplicate callId detected (race condition), already processed`);
      return res.status(200).json({ 
        success: true, 
        message: 'Call already processed',
        duplicate: true 
      });
    }

    console.error('❌ [RETELL WEBHOOK] Error:', error.message);
    console.error('   Stack:', error.stack);
    
    // Return success to prevent retry storms
    return res.status(200).json({ 
      success: true,
      message: 'Error processing webhook, logged',
      error: error.message
    });
  }
});

module.exports = router;
