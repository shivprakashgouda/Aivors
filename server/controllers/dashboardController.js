/**
 * Dashboard Controller
 * Provides analytics and statistics for the dashboard
 */

const { Call, Subscription, User } = require('../models');
const {
  formatResponse,
  formatError,
  getSubscriptionFlags
} = require('../utils/helpers');

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics for a user
 * Query params: userId (required)
 */
const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json(
        formatError('Missing required query parameter: userId', 400)
      );
    }
    
    // Get call statistics
    const callStats = await Call.getUserCallStats(userId);
    
    // Get last 10 calls
    const lastCalls = await Call.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('callId phoneNumber durationMinutes transcript summary createdAt status')
      .lean();
    
    // Get subscription details
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
    
    // Get subscription flags
    const subscriptionFlags = getSubscriptionFlags(subscription.availableCredits);
    
    // Get user info (if exists)
    const user = await User.findOne({ userId }).select('name email status').lean();
    
    // Calculate today's calls
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const callsToday = await Call.countDocuments({
      userId,
      createdAt: { $gte: todayStart }
    });
    
    // Calculate yesterday's calls for percentage change
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const callsYesterday = await Call.countDocuments({
      userId,
      createdAt: { 
        $gte: yesterdayStart,
        $lt: todayStart
      }
    });
    
    // Calculate percentage change
    let callsChangePercent = 0;
    if (callsYesterday > 0) {
      callsChangePercent = ((callsToday - callsYesterday) / callsYesterday) * 100;
    } else if (callsToday > 0) {
      callsChangePercent = 100;
    }
    
    // Prepare dashboard data
    const dashboardData = {
      user: user ? {
        userId: user.userId,
        name: user.name,
        email: user.email,
        status: user.status
      } : null,
      
      callAnalytics: {
        totalCalls: callStats.totalCalls,
        callsToday,
        callsYesterday,
        callsChangePercent: Math.round(callsChangePercent * 100) / 100,
        totalMinutesUsed: callStats.totalMinutes,
        totalSecondsUsed: callStats.totalSeconds,
        averageDuration: Math.round(callStats.avgDuration * 100) / 100
      },
      
      subscription: {
        totalCredits: subscription.totalCredits,
        usedCredits: subscription.usedCredits,
        availableCredits: subscription.availableCredits,
        planName: subscription.planName,
        planType: subscription.planType,
        status: subscription.status,
        renewalDate: subscription.renewalDate,
        ...subscriptionFlags
      },
      
      recentCalls: lastCalls.map(call => ({
        callId: call.callId,
        phoneNumber: call.phoneNumber,
        durationMinutes: call.durationMinutes,
        transcriptPreview: call.transcript.substring(0, 100),
        summaryPreview: call.summary.substring(0, 150),
        createdAt: call.createdAt,
        status: call.status,
        timeAgo: getTimeAgo(call.createdAt)
      })),
      
      alerts: {
        lowBalance: subscriptionFlags.lowBalance,
        noCredits: subscriptionFlags.stopWorkflow,
        message: subscriptionFlags.stopWorkflow
          ? 'No credits remaining. Please add credits to continue.'
          : subscriptionFlags.lowBalance
          ? `Low balance: Only ${subscriptionFlags.creditsRemaining} minutes remaining`
          : null
      }
    };
    
    return res.status(200).json(
      formatResponse(true, 'Dashboard statistics retrieved successfully', dashboardData)
    );
    
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json(
      formatError('Failed to retrieve dashboard statistics', 500, error.message)
    );
  }
};

/**
 * GET /api/dashboard/recent-activity/:userId
 * Get recent activity feed for a user
 */
const getRecentActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    // Get recent calls
    const recentCalls = await Call.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('callId phoneNumber durationMinutes createdAt')
      .lean();
    
    // Format as activity feed
    const activities = recentCalls.map(call => ({
      type: 'call_completed',
      text: `Call with ${call.phoneNumber} completed (${call.durationMinutes} min)`,
      timeAgo: getTimeAgo(call.createdAt),
      timestamp: call.createdAt,
      metadata: {
        callId: call.callId,
        phoneNumber: call.phoneNumber,
        durationMinutes: call.durationMinutes
      }
    }));
    
    return res.status(200).json(
      formatResponse(true, 'Recent activity retrieved successfully', { activities })
    );
    
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return res.status(500).json(
      formatError('Failed to retrieve recent activity', 500, error.message)
    );
  }
};

/**
 * GET /api/dashboard/analytics/:userId
 * Get detailed analytics for charts and graphs
 */
const getAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; // 'week', 'month', 'year'
    
    // Determine date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30); // Default 30 days
    }
    
    // Get calls in period
    const calls = await Call.find({
      userId,
      createdAt: { $gte: startDate }
    }).select('durationMinutes createdAt').lean();
    
    // Group by day
    const callsByDay = {};
    calls.forEach(call => {
      const day = call.createdAt.toISOString().split('T')[0];
      if (!callsByDay[day]) {
        callsByDay[day] = { count: 0, minutes: 0 };
      }
      callsByDay[day].count += 1;
      callsByDay[day].minutes += call.durationMinutes;
    });
    
    // Format for charts
    const chartData = Object.keys(callsByDay).sort().map(day => ({
      date: day,
      calls: callsByDay[day].count,
      minutes: callsByDay[day].minutes
    }));
    
    return res.status(200).json(
      formatResponse(true, 'Analytics retrieved successfully', {
        period,
        startDate,
        endDate: now,
        totalCalls: calls.length,
        totalMinutes: calls.reduce((sum, call) => sum + call.durationMinutes, 0),
        chartData
      })
    );
    
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    return res.status(500).json(
      formatError('Failed to retrieve analytics', 500, error.message)
    );
  }
};

/**
 * Helper function to calculate time ago
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' year' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' month' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' day' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago';
  
  return 'just now';
}

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getAnalytics
};
