const express = require('express');
const User = require('../models/User');
const { authGuard } = require('../utils/jwt');

const router = express.Router();

// GET /api/dashboard - Get current user's dashboard data
router.get('/', authGuard, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return all user data including new fields
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      subscription: user.subscription,
      business: user.business,
      analytics: user.analytics,
      recentActivity: user.recentActivity,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

// GET /api/dashboard/:userId - Get specific user's dashboard data (admin only)
router.get('/:userId', authGuard, async (req, res) => {
  try {
    // Only allow admins to view other users' dashboards
    if (req.user.role !== 'admin' && req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      subscription: user.subscription,
      business: user.business,
      analytics: user.analytics,
      recentActivity: user.recentActivity,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

module.exports = router;
