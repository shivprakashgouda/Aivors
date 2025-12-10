/**
 * Dashboard Controller
 * Provides analytics and statistics for the dashboard
 * NOW FETCHES DATA FROM AIRTABLE
 */

const { Subscription, User } = require('../models');
const {
  formatResponse,
  formatError,
  getSubscriptionFlags
} = require('../utils/helpers');
const { getAllRecordsByUserId } = require('../services/airtableService');

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics for a user
 * Query params: userId (required)
 * NOW USES AIRTABLE DATA INSTEAD OF OLD CALL MODEL
 */
const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json(
        formatError('Missing required query parameter: userId', 400)
      );
    }
    
    console.log(`📊 Fetching dashboard stats from Airtable for user: ${userId}`);
    
    // Fetch all records from Airtable for this user
    const airtableRecords = await getAllRecordsByUserId(userId);
    
    console.log(`✅ Retrieved ${airtableRecords.length} records from Airtable`);
    
    // Process Airtable records into call statistics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    let totalMinutes = 0;
    let totalSeconds = 0;
    let callsToday = 0;
    let callsYesterday = 0;
    const processedCalls = [];
    
    // Process each Airtable record
    airtableRecords.forEach(record => {
      const fields = record.fields;
      const createdTime = new Date(record.createdTime);
      
      // Extract duration (try multiple field names)
      const durationMinutes = parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0);
      const durationSeconds = parseFloat(fields.duration_seconds || fields.durationSeconds || durationMinutes * 60 || 0);
      
      totalMinutes += durationMinutes;
      totalSeconds += durationSeconds;
      
      // Count today's calls
      if (createdTime >= todayStart) {
        callsToday++;
      }
      
      // Count yesterday's calls
      if (createdTime >= yesterdayStart && createdTime < todayStart) {
        callsYesterday++;
      }
      
      // Prepare call data for display
      processedCalls.push({
        callId: record.id,
        phoneNumber: fields.phone_number || fields.phoneNumber || fields.phone || 'N/A',
        durationMinutes: durationMinutes,
        transcript: fields.transcript || '',
        transcriptPreview: (fields.transcript || '').substring(0, 150),
        summary: fields.summary || fields.notes || '',
        summaryPreview: (fields.summary || fields.notes || '').substring(0, 200),
        createdAt: record.createdTime,
        status: fields.status || fields.call_status || 'completed',
        // Include all fields for display
        allFields: fields
      });
    });
    
    // Sort calls by date (newest first)
    processedCalls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Get last 10 calls
    const lastCalls = processedCalls.slice(0, 10);
    
    // Calculate percentage change
    let callsChangePercent = 0;
    if (callsYesterday > 0) {
      callsChangePercent = ((callsToday - callsYesterday) / callsYesterday) * 100;
    } else if (callsToday > 0) {
      callsChangePercent = 100;
    }
    
    // Calculate average duration
    const averageDuration = airtableRecords.length > 0 
      ? totalMinutes / airtableRecords.length 
      : 0;
    
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
    
    // Prepare dashboard data
    const dashboardData = {
      user: user ? {
        userId: user.userId,
        name: user.name,
        email: user.email,
        status: user.status
      } : null,
      
      callAnalytics: {
        totalCalls: airtableRecords.length,
        callsToday,
        callsYesterday,
        callsChangePercent: Math.round(callsChangePercent * 100) / 100,
        totalMinutesUsed: Math.round(totalMinutes * 100) / 100,
        totalSecondsUsed: Math.round(totalSeconds),
        averageDuration: Math.round(averageDuration * 100) / 100
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
        transcriptPreview: call.transcriptPreview,
        summaryPreview: call.summaryPreview,
        transcript: call.transcript,
        summary: call.summary,
        createdAt: call.createdAt,
        status: call.status,
        timeAgo: getTimeAgo(call.createdAt),
        airtableFields: call.allFields
      })),
      
      alerts: {
        lowBalance: subscriptionFlags.lowBalance,
        noCredits: subscriptionFlags.stopWorkflow,
        message: subscriptionFlags.stopWorkflow
          ? 'No credits remaining. Please add credits to continue.'
          : subscriptionFlags.lowBalance
          ? `Low balance: Only ${subscriptionFlags.creditsRemaining} minutes remaining`
          : null
      },
      
      // Data source indicator
      dataSource: 'airtable',
      airtableRecordCount: airtableRecords.length
    };
    
    console.log(`✅ Dashboard stats prepared from Airtable: ${airtableRecords.length} total records, ${callsToday} today`);
    
    return res.status(200).json(
      formatResponse(true, 'Dashboard statistics retrieved successfully from Airtable', dashboardData)
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
 * NOW USES AIRTABLE DATA
 */
const getRecentActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    console.log(`📋 Fetching recent activity from Airtable for user: ${userId}`);
    
    // Get records from Airtable
    const airtableRecords = await getAllRecordsByUserId(userId);
    
    // Sort by date (newest first) and limit
    const sortedRecords = airtableRecords
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
      .slice(0, limit);
    
    // Format as activity feed
    const activities = sortedRecords.map(record => {
      const fields = record.fields;
      const phoneNumber = fields.phone_number || fields.phoneNumber || fields.phone || 'Unknown';
      const durationMinutes = parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0);
      
      return {
        type: 'call_completed',
        text: `Call with ${phoneNumber} completed (${durationMinutes.toFixed(1)} min)`,
        timeAgo: getTimeAgo(record.createdTime),
        timestamp: record.createdTime,
        metadata: {
          callId: record.id,
          phoneNumber: phoneNumber,
          durationMinutes: durationMinutes
        }
      };
    });
    
    console.log(`✅ Retrieved ${activities.length} activities from Airtable`);
    
    return res.status(200).json(
      formatResponse(true, 'Recent activity retrieved successfully from Airtable', { activities })
    );
    
  } catch (error) {
    console.error('❌ Error in getRecentActivity:', error);
    return res.status(500).json(
      formatError('Failed to retrieve recent activity from Airtable', 500, error.message)
    );
  }
};

/**
 * GET /api/dashboard/analytics/:userId
 * Get detailed analytics for charts and graphs
 * NOW USES AIRTABLE DATA
 */
const getAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; // 'week', 'month', 'year'
    
    console.log(`📈 Fetching analytics from Airtable for user: ${userId}, period: ${period}`);
    
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
    
    // Get all records from Airtable
    const airtableRecords = await getAllRecordsByUserId(userId);
    
    // Filter by date range
    const recordsInPeriod = airtableRecords.filter(record => {
      const recordDate = new Date(record.createdTime);
      return recordDate >= startDate && recordDate <= now;
    });
    
    // Group by day
    const callsByDay = {};
    recordsInPeriod.forEach(record => {
      const fields = record.fields;
      const day = new Date(record.createdTime).toISOString().split('T')[0];
      const durationMinutes = parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0);
      
      if (!callsByDay[day]) {
        callsByDay[day] = { count: 0, minutes: 0 };
      }
      callsByDay[day].count += 1;
      callsByDay[day].minutes += durationMinutes;
    });
    
    // Format for charts
    const chartData = Object.keys(callsByDay).sort().map(day => ({
      date: day,
      calls: callsByDay[day].count,
      minutes: Math.round(callsByDay[day].minutes * 100) / 100
    }));
    
    const totalMinutes = recordsInPeriod.reduce((sum, record) => {
      const fields = record.fields;
      return sum + parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0);
    }, 0);
    
    console.log(`✅ Analytics retrieved: ${recordsInPeriod.length} records in period`);
    
    return res.status(200).json(
      formatResponse(true, 'Analytics retrieved successfully from Airtable', {
        period,
        startDate,
        endDate: now,
        totalCalls: recordsInPeriod.length,
        totalMinutes: Math.round(totalMinutes * 100) / 100,
        chartData,
        dataSource: 'airtable'
      })
    );
    
  } catch (error) {
    console.error('❌ Error in getAnalytics:', error);
    return res.status(500).json(
      formatError('Failed to retrieve analytics from Airtable', 500, error.message)
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
