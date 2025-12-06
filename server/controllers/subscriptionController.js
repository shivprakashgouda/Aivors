/**
 * Subscription Controller
 * Manages user subscription credits and updates
 */

const { Subscription, User } = require('../models');
const {
  formatResponse,
  formatError,
  getSubscriptionFlags,
  logEvent,
  secondsToMinutes
} = require('../utils/helpers');

/**
 * POST /api/subscription/update
 * Update subscription credits after a call
 * Called by n8n subscription webhook
 */
const updateSubscription = async (req, res) => {
  try {
    const { userId, durationMinutes, durationSeconds } = req.body;
    
    logEvent('SUBSCRIPTION_UPDATE_START', { userId, durationMinutes, durationSeconds });
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json(
        formatError('Missing required field: userId', 400)
      );
    }
    
    // Calculate duration in minutes
    let minutes = durationMinutes;
    if (!minutes && durationSeconds) {
      minutes = secondsToMinutes(durationSeconds);
    }
    
    if (!minutes || minutes <= 0) {
      return res.status(400).json(
        formatError('Invalid duration: durationMinutes or durationSeconds required', 400)
      );
    }
    
    // Find or create subscription
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      // Create new subscription with 0 credits
      subscription = await Subscription.create({
        userId,
        totalCredits: 0,
        usedCredits: 0,
        status: 'active'
      });
      
      logEvent('SUBSCRIPTION_CREATED', { userId, subscription });
    }
    
    // Deduct credits
    await subscription.deductCredits(minutes);
    
    logEvent('CREDITS_DEDUCTED', {
      userId,
      minutesDeducted: minutes,
      usedCredits: subscription.usedCredits,
      availableCredits: subscription.availableCredits
    });
    
    // Get subscription status flags
    const flags = getSubscriptionFlags(subscription.availableCredits);
    
    // Prepare response for n8n
    const responseData = {
      userId,
      subscription: {
        totalCredits: subscription.totalCredits,
        usedCredits: subscription.usedCredits,
        availableCredits: subscription.availableCredits,
        status: subscription.status
      },
      deductedMinutes: minutes,
      ...flags,
      // Alert flags for n8n workflow
      alerts: {
        shouldDisableWorkflow: flags.stopWorkflow,
        shouldNotifyLowBalance: flags.lowBalance,
        message: flags.stopWorkflow 
          ? 'No credits remaining. Workflow should be disabled.'
          : flags.lowBalance
          ? `Low balance warning: ${flags.creditsRemaining} minutes remaining`
          : `Subscription updated. ${flags.creditsRemaining} minutes remaining`
      }
    };
    
    logEvent('SUBSCRIPTION_UPDATE_SUCCESS', responseData);
    
    return res.status(200).json(
      formatResponse(true, 'Subscription updated successfully', responseData)
    );
    
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    logEvent('SUBSCRIPTION_UPDATE_ERROR', { error: error.message });
    
    return res.status(500).json(
      formatError('Failed to update subscription', 500, error.message)
    );
  }
};

/**
 * GET /api/subscription/:userId
 * Get subscription details for a user
 */
const getSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    
    let subscription = await Subscription.findOne({ userId });
    
    // Create subscription if not exists
    if (!subscription) {
      subscription = await Subscription.create({
        userId,
        totalCredits: 0,
        usedCredits: 0,
        status: 'active'
      });
    }
    
    const flags = getSubscriptionFlags(subscription.availableCredits);
    
    return res.status(200).json(
      formatResponse(true, 'Subscription retrieved successfully', {
        subscription: {
          userId: subscription.userId,
          totalCredits: subscription.totalCredits,
          usedCredits: subscription.usedCredits,
          availableCredits: subscription.availableCredits,
          planName: subscription.planName,
          planType: subscription.planType,
          status: subscription.status,
          renewalDate: subscription.renewalDate
        },
        ...flags
      })
    );
    
  } catch (error) {
    console.error('Error in getSubscription:', error);
    return res.status(500).json(
      formatError('Failed to retrieve subscription', 500, error.message)
    );
  }
};

/**
 * POST /api/subscription/add-credits
 * Add credits to a user's subscription
 */
const addCredits = async (req, res) => {
  try {
    const { userId, minutes } = req.body;
    
    if (!userId || !minutes || minutes <= 0) {
      return res.status(400).json(
        formatError('Invalid request: userId and positive minutes required', 400)
      );
    }
    
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      subscription = await Subscription.create({
        userId,
        totalCredits: minutes,
        usedCredits: 0,
        status: 'active'
      });
    } else {
      await subscription.addCredits(minutes);
    }
    
    logEvent('CREDITS_ADDED', {
      userId,
      minutesAdded: minutes,
      totalCredits: subscription.totalCredits,
      availableCredits: subscription.availableCredits
    });
    
    return res.status(200).json(
      formatResponse(true, 'Credits added successfully', {
        userId,
        minutesAdded: minutes,
        subscription: {
          totalCredits: subscription.totalCredits,
          usedCredits: subscription.usedCredits,
          availableCredits: subscription.availableCredits
        }
      })
    );
    
  } catch (error) {
    console.error('Error in addCredits:', error);
    return res.status(500).json(
      formatError('Failed to add credits', 500, error.message)
    );
  }
};

/**
 * PUT /api/subscription/:userId/status
 * Update subscription status (active, inactive, suspended, cancelled)
 */
const updateSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'inactive', 'suspended', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        formatError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
      );
    }
    
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      return res.status(404).json(
        formatError('Subscription not found', 404)
      );
    }
    
    subscription.status = status;
    await subscription.save();
    
    logEvent('SUBSCRIPTION_STATUS_UPDATED', { userId, newStatus: status });
    
    return res.status(200).json(
      formatResponse(true, 'Subscription status updated', {
        userId,
        status: subscription.status
      })
    );
    
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error);
    return res.status(500).json(
      formatError('Failed to update subscription status', 500, error.message)
    );
  }
};

module.exports = {
  updateSubscription,
  getSubscription,
  addCredits,
  updateSubscriptionStatus
};
