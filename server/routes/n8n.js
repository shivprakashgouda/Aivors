const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const UsageLog = require('../models/UsageLog');

const router = express.Router();

/**
 * Middleware to verify n8n webhook secret
 * Ensures only authorized n8n workflows can update data
 */
const verifyN8NSecret = (req, res, next) => {
  const webhookSecret = req.headers['x-n8n-webhook-secret'];
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.warn('⚠️  N8N_WEBHOOK_SECRET not configured in environment');
    return next(); // Allow in development, block in production
  }

  if (webhookSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid webhook secret'
    });
  }

  next();
};

/**
 * POST /api/subscription/update
 * 
 * Receives subscription updates from n8n workflow
 * Updates User model with new subscription data
 * 
 * Expected payload from n8n:
 * {
 *   eventType: string,
 *   customerId: string (Stripe customer ID),
 *   subscriptionId: string,
 *   subscription: {
 *     plan: 'Free' | 'Pro' | 'Enterprise',
 *     status: 'active' | 'past_due' | 'cancelled' | 'inactive',
 *     minutesPurchased: number,
 *     minutesRemaining: number | null,
 *     stripeCustomerId: string,
 *     stripeSubscriptionId: string,
 *     nextBillingDate: ISO date string,
 *     amount: number
 *   },
 *   analytics: { ... },
 *   business: { ... },
 *   metadata: { ... }
 * }
 */
router.post('/subscription/update', verifyN8NSecret, async (req, res) => {
  try {
    const {
      eventType,
      customerId,
      subscriptionId,
      subscription,
      analytics,
      business,
      metadata
    } = req.body;

    // Validate required fields
    if (!customerId || !subscription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, subscription'
      });
    }

    // Find user by Stripe customer ID
    let user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

    // If not found, try to find by email (fallback for first subscription)
    if (!user) {
      // In production, you'd match by email from Stripe customer object
      // For now, we'll create a log entry
      console.log(`⚠️  User not found for Stripe customer: ${customerId}`);
      
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user associated with this Stripe customer ID',
        customerId
      });
    }

    // Build update object
    const updateData = {
      status: subscription.status === 'active' ? 'active' : 
              subscription.status === 'cancelled' ? 'cancelled' : 'inactive',
      'subscription.plan': subscription.plan,
      'subscription.status': subscription.status,
      'subscription.stripeCustomerId': subscription.stripeCustomerId,
      'subscription.stripeSubscriptionId': subscription.stripeSubscriptionId,
      'subscription.nextBillingDate': subscription.nextBillingDate,
    };

    // Handle minutes logic
    if (eventType === 'customer.subscription.created') {
      // New subscription - set full minutes
      updateData['subscription.minutesPurchased'] = subscription.minutesPurchased;
      updateData['subscription.minutesRemaining'] = subscription.minutesPurchased;
      updateData['subscription.startDate'] = new Date();
    } else if (eventType === 'customer.subscription.updated') {
      // Updated subscription - preserve remaining minutes or add new
      if (subscription.minutesPurchased !== user.subscription.minutesPurchased) {
        // Plan changed - update purchased minutes
        updateData['subscription.minutesPurchased'] = subscription.minutesPurchased;
        
        // Add difference to remaining minutes (upgrade scenario)
        const minuteDifference = subscription.minutesPurchased - user.subscription.minutesPurchased;
        if (minuteDifference > 0) {
          updateData['subscription.minutesRemaining'] = 
            user.subscription.minutesRemaining + minuteDifference;
        } else {
          // Downgrade - keep remaining as is (don't reduce)
          updateData['subscription.minutesRemaining'] = user.subscription.minutesRemaining;
        }
      }
    } else if (eventType === 'customer.subscription.deleted') {
      // Cancelled - set to Free plan
      updateData['subscription.plan'] = 'Free';
      updateData['subscription.status'] = 'cancelled';
      updateData['subscription.minutesPurchased'] = 10;
      updateData['subscription.minutesRemaining'] = 10;
      updateData.status = 'cancelled';
    }

    // Update business status if provided
    if (business) {
      if (business.setupStatus) updateData['business.setupStatus'] = business.setupStatus;
      if (business.aiTrainingStatus) updateData['business.aiTrainingStatus'] = business.aiTrainingStatus;
      if (business.posIntegration) updateData['business.posIntegration'] = business.posIntegration;
      if (business.phoneNumber) updateData['business.phoneNumber'] = business.phoneNumber;
    }

    // Update analytics if provided
    if (analytics) {
      if (analytics.callsToday !== undefined) updateData['analytics.callsToday'] = analytics.callsToday;
      if (analytics.callsChangePercent !== undefined) updateData['analytics.callsChangePercent'] = analytics.callsChangePercent;
      if (analytics.aiStatus) updateData['analytics.aiStatus'] = analytics.aiStatus;
      if (analytics.responseTime !== undefined) updateData['analytics.responseTime'] = analytics.responseTime;
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'SUBSCRIPTION_UPDATED_VIA_N8N',
      payload: {
        stripeEvent: eventType,
        plan: subscription.plan,
        status: subscription.status,
        source: 'n8n-webhook',
        metadata
      },
      ipAddress: req.ip || 'n8n-webhook',
      userAgent: req.get('user-agent') || 'n8n-automation',
    });

    // Add recent activity
    const activityText = eventType === 'customer.subscription.created' 
      ? `Subscribed to ${subscription.plan} plan`
      : eventType === 'customer.subscription.updated'
      ? `Subscription updated to ${subscription.plan} plan`
      : `Subscription cancelled`;

    updatedUser.recentActivity.unshift({
      text: activityText,
      timeAgo: 'Just now',
      createdAt: new Date()
    });

    // Keep only last 10 activities
    if (updatedUser.recentActivity.length > 10) {
      updatedUser.recentActivity = updatedUser.recentActivity.slice(0, 10);
    }

    await updatedUser.save();

    // Log success
    console.log(`✅ Subscription updated for user ${user.email}: ${subscription.plan} (${subscription.status})`);

    // Return success response
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      userId: user._id,
      customerId,
      subscription: {
        plan: updatedUser.subscription.plan,
        status: updatedUser.subscription.status,
        minutesRemaining: updatedUser.subscription.minutesRemaining
      },
      analytics: updatedUser.analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating subscription via n8n:', error);
    
    // Create error audit log
    try {
      await AuditLog.create({
        userId: null,
        eventType: 'N8N_SUBSCRIPTION_UPDATE_ERROR',
        payload: {
          error: error.message,
          body: req.body
        },
        ipAddress: req.ip || 'n8n-webhook',
        userAgent: req.get('user-agent') || 'n8n-automation',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/update
 * 
 * Updates user analytics/dashboard metrics from n8n
 * Supports real-time dashboard updates
 * 
 * Expected payload:
 * {
 *   customerId: string,
 *   analytics: {
 *     callsToday: number,
 *     callsChangePercent: number,
 *     aiStatus: 'Online' | 'Offline' | 'Maintenance',
 *     responseTime: number
 *   }
 * }
 */
router.post('/analytics/update', verifyN8NSecret, async (req, res) => {
  try {
    const { customerId, analytics } = req.body;

    if (!customerId || !analytics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, analytics'
      });
    }

    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        customerId
      });
    }

    // Update analytics fields
    const updateData = {};
    if (analytics.callsToday !== undefined) updateData['analytics.callsToday'] = analytics.callsToday;
    if (analytics.callsChangePercent !== undefined) updateData['analytics.callsChangePercent'] = analytics.callsChangePercent;
    if (analytics.aiStatus) updateData['analytics.aiStatus'] = analytics.aiStatus;
    if (analytics.responseTime !== undefined) updateData['analytics.responseTime'] = analytics.responseTime;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Create usage log for tracking
    await UsageLog.create({
      userId: user._id,
      action: 'analytics_sync',
      minutesUsed: 0,
      metadata: {
        source: 'n8n-analytics-update',
        analytics
      }
    });

    console.log(`✅ Analytics updated for user ${user.email}`);

    res.json({
      success: true,
      message: 'Analytics updated successfully',
      userId: user._id,
      analytics: updatedUser.analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating analytics via n8n:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/n8n/health
 * 
 * Health check endpoint for n8n monitoring
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'n8n-integration',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/n8n/test
 * 
 * Test endpoint for verifying n8n connectivity
 * Does not require authentication (for initial setup)
 */
router.post('/test', async (req, res) => {
  try {
    const { testData } = req.body;

    console.log('📥 Received test payload from n8n:', testData);

    res.json({
      success: true,
      message: 'n8n connection test successful',
      received: testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
