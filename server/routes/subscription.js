const express = require('express');
const User = require('../models/User');
const { authGuard } = require('../utils/jwt');

const router = express.Router();

// GET /api/subscription/me - Get current user's subscription
router.get('/me', authGuard, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      subscription: user.subscription,
      status: user.status,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
