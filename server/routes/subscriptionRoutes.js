/**
 * Subscription Routes
 * Routes for subscription credit management
 */

const express = require('express');
const router = express.Router();
const {
  updateSubscription,
  getSubscription,
  addCredits,
  updateSubscriptionStatus
} = require('../controllers/subscriptionController');

/**
 * POST /api/subscription/update
 * Update subscription credits after a call
 * Called by n8n subscription webhook
 * Body: { userId, durationMinutes, durationSeconds }
 */
router.post('/update', updateSubscription);

/**
 * GET /api/subscription/:userId
 * Get subscription details for a user
 */
router.get('/:userId', getSubscription);

/**
 * POST /api/subscription/add-credits
 * Add credits to a user's subscription
 * Body: { userId, minutes }
 */
router.post('/add-credits', addCredits);

/**
 * PUT /api/subscription/:userId/status
 * Update subscription status
 * Body: { status } (active, inactive, suspended, cancelled)
 */
router.put('/:userId/status', updateSubscriptionStatus);

module.exports = router;
