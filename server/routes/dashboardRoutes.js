/**
 * Dashboard Routes
 * Routes for dashboard analytics and statistics
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivity,
  getAnalytics
} = require('../controllers/dashboardController');

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics
 * Query params: userId (required)
 */
router.get('/stats', getDashboardStats);

/**
 * GET /api/dashboard/recent-activity/:userId
 * Get recent activity feed for a user
 * Query params: limit (default 20)
 */
router.get('/recent-activity/:userId', getRecentActivity);

/**
 * GET /api/dashboard/analytics/:userId
 * Get detailed analytics for charts
 * Query params: period (week, month, year)
 */
router.get('/analytics/:userId', getAnalytics);

module.exports = router;
