const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const { authGuard } = require('../utils/jwt');

/**
 * GET /api/my-calls
 * 
 * Authenticated endpoint to fetch calls for logged-in user
 * Returns calls filtered by user's email, sorted by latest first
 */
router.get('/', authGuard, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId).select('email');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    console.log(`📊 [MY CALLS] Fetching calls for user: ${user.email}`);

    // Fetch calls for this user, sorted by latest first
    const calls = await Call.find({ email: user.email })
      .sort({ createdAt: -1 })
      .select('callId phoneNumber summary transcript durationSeconds createdAt eventType')
      .lean();

    console.log(`✅ [MY CALLS] Found ${calls.length} calls for ${user.email}`);

    return res.status(200).json({
      success: true,
      data: calls,
      count: calls.length,
      email: user.email
    });

  } catch (error) {
    console.error('❌ [MY CALLS] Error:', error.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch calls',
      message: error.message
    });
  }
});

module.exports = router;
