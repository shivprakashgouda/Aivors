const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signAccessToken, signRefreshToken, authGuard, adminGuard } = require('../utils/jwt');

const router = express.Router();

// POST /api/admin/login - Admin login (separate from user login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Create audit log
    await AuditLog.create({
      adminId: user._id,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'admin_login', email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate tokens and set cookies (align with user auth flow)
    const access = signAccessToken(user._id.toString(), user.role);
    const refresh = signRefreshToken(user._id.toString(), user.role);
    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
    res.cookie('access_token', access, { ...cookieBase, maxAge: 15 * 60 * 1000 }); // 15m
    res.cookie('refresh_token', refresh, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d

    res.json({
      message: 'Admin login successful',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// GET /api/admin/users - Get all users (admin only)
router.get('/users', authGuard, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = '' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-passwordHash -__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/subscription - Modify user subscription (admin only)
router.put('/users/:id/subscription', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status, minutesPurchased, minutesRemaining } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription
    if (plan !== undefined) user.subscription.plan = plan;
    if (status !== undefined) user.subscription.status = status;
    if (minutesPurchased !== undefined) user.subscription.minutesPurchased = minutesPurchased;
    if (minutesRemaining !== undefined) user.subscription.minutesRemaining = minutesRemaining;

    // Update user status based on subscription
    if (status === 'active' && user.status === 'pending_payment') {
      user.status = 'active';
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      adminId: req.user.userId,
      eventType: 'SUBSCRIPTION_MODIFIED',
      payload: { plan, status, minutesPurchased, minutesRemaining },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Subscription updated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/audit-logs - Get audit logs (admin only)
router.get('/audit-logs', authGuard, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 100, eventType = '', userId = '' } = req.query;

    const query = {};
    if (eventType) query.eventType = eventType;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/status - Update user status (admin only)
router.put('/users/:id/status', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending_payment', 'active', 'inactive', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      adminId: req.user.userId,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'status_update', newStatus: status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'User status updated',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/business - Update user business setup (admin/developer only)
router.put('/users/:id/business', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { setupStatus, aiTrainingStatus, posIntegration, phoneNumber } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update business fields
    if (setupStatus !== undefined) user.business.setupStatus = setupStatus;
    if (aiTrainingStatus !== undefined) user.business.aiTrainingStatus = aiTrainingStatus;
    if (posIntegration !== undefined) user.business.posIntegration = posIntegration;
    if (phoneNumber !== undefined) user.business.phoneNumber = phoneNumber;

    await user.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      adminId: req.user.userId,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'business_update', updates: { setupStatus, aiTrainingStatus, posIntegration, phoneNumber } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Business setup updated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/analytics - Update user analytics (admin/developer only)
router.put('/users/:id/analytics', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { callsToday, callsChangePercent, aiStatus, responseTime } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update analytics fields
    if (callsToday !== undefined) user.analytics.callsToday = callsToday;
    if (callsChangePercent !== undefined) user.analytics.callsChangePercent = callsChangePercent;
    if (aiStatus !== undefined) user.analytics.aiStatus = aiStatus;
    if (responseTime !== undefined) user.analytics.responseTime = responseTime;

    await user.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      adminId: req.user.userId,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'analytics_update', updates: { callsToday, callsChangePercent, aiStatus, responseTime } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Analytics updated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Update analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users/:id/activity - Add recent activity entry (admin/developer only)
router.post('/users/:id/activity', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, timeAgo } = req.body;

    if (!text || !timeAgo) {
      return res.status(400).json({ error: 'Text and timeAgo are required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add new activity entry (limit to last 10 entries)
    user.recentActivity.unshift({
      text,
      timeAgo,
      createdAt: new Date(),
    });

    // Keep only last 10 activities
    if (user.recentActivity.length > 10) {
      user.recentActivity = user.recentActivity.slice(0, 10);
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      adminId: req.user.userId,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'activity_added', text },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Activity added successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update all user fields at once (admin/developer only)
router.put('/users/:id', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription, business, analytics, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription if provided
    if (subscription) {
      Object.keys(subscription).forEach(key => {
        if (subscription[key] !== undefined) {
          user.subscription[key] = subscription[key];
        }
      });
    }

    // Update business if provided
    if (business) {
      Object.keys(business).forEach(key => {
        if (business[key] !== undefined) {
          user.business[key] = business[key];
        }
      });
    }

    // Update analytics if provided
    if (analytics) {
      Object.keys(analytics).forEach(key => {
        if (analytics[key] !== undefined) {
          user.analytics[key] = analytics[key];
        }
      });
    }

    // Update status if provided
    if (status !== undefined) {
      user.status = status;
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      adminId: req.user.userId,
      eventType: 'ADMIN_ACTION',
      payload: { action: 'full_user_update', updates: { subscription, business, analytics, status } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'User updated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
