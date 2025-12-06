/**
 * Call Analytics Controller
 * Handles call data from Retell AI webhooks
 */

const { Call, Subscription } = require('../models');
const {
  extractCallData,
  formatResponse,
  formatError,
  getSubscriptionFlags,
  getOrCreateSubscription,
  logEvent
} = require('../utils/helpers');

/**
 * POST /api/calls/analyze
 * Process call_analyze event from Retell AI
 * Called by n8n webhook after receiving Retell AI event
 */
const analyzeCall = async (req, res) => {
  try {
    logEvent('CALL_ANALYZE_START', { body: req.body });
    
    // Extract call data from request
    const callData = extractCallData(req.body);
    
    // Validate required fields
    if (!callData.callId || !callData.userId) {
      return res.status(400).json(
        formatError('Missing required fields: callId or userId', 400)
      );
    }
    
    // Save call to database
    const call = await Call.create({
      callId: callData.callId,
      userId: callData.userId,
      phoneNumber: callData.phoneNumber,
      durationSeconds: callData.durationSeconds,
      durationMinutes: callData.durationMinutes,
      transcript: callData.transcript,
      summary: callData.summary,
      eventType: callData.eventType,
      metadata: callData.metadata,
      callStartTime: callData.callStartTime,
      callEndTime: callData.callEndTime,
      status: 'completed'
    });
    
    logEvent('CALL_SAVED', { callId: call.callId, durationMinutes: call.durationMinutes });
    
    // Get subscription info
    const subscription = await getOrCreateSubscription(Subscription, callData.userId);
    const subscriptionFlags = getSubscriptionFlags(subscription.availableCredits);
    
    // Prepare response for n8n
    const responseData = {
      call: {
        callId: call.callId,
        userId: call.userId,
        phoneNumber: call.phoneNumber,
        durationMinutes: call.durationMinutes,
        durationSeconds: call.durationSeconds,
        transcriptLength: call.transcript.length,
        summaryLength: call.summary.length,
        createdAt: call.createdAt
      },
      subscription: {
        availableCredits: subscription.availableCredits,
        totalCredits: subscription.totalCredits,
        usedCredits: subscription.usedCredits,
        ...subscriptionFlags
      },
      // Instructions for n8n
      nextAction: {
        shouldUpdateSubscription: true,
        durationMinutes: call.durationMinutes,
        userId: call.userId
      }
    };
    
    logEvent('CALL_ANALYZE_SUCCESS', responseData);
    
    return res.status(201).json(
      formatResponse(true, 'Call analyzed and saved successfully', responseData)
    );
    
  } catch (error) {
    console.error('Error in analyzeCall:', error);
    logEvent('CALL_ANALYZE_ERROR', { error: error.message });
    
    return res.status(500).json(
      formatError('Failed to analyze call', 500, error.message)
    );
  }
};

/**
 * GET /api/calls/:callId
 * Get details of a specific call
 */
const getCallById = async (req, res) => {
  try {
    const { callId } = req.params;
    
    const call = await Call.findOne({ callId });
    
    if (!call) {
      return res.status(404).json(
        formatError('Call not found', 404)
      );
    }
    
    return res.status(200).json(
      formatResponse(true, 'Call retrieved successfully', { call })
    );
    
  } catch (error) {
    console.error('Error in getCallById:', error);
    return res.status(500).json(
      formatError('Failed to retrieve call', 500, error.message)
    );
  }
};

/**
 * GET /api/calls/user/:userId
 * Get all calls for a specific user
 */
const getUserCalls = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    const calls = await Call.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v');
    
    const totalCalls = await Call.countDocuments({ userId });
    
    return res.status(200).json(
      formatResponse(true, 'Calls retrieved successfully', {
        calls,
        totalCalls,
        limit,
        skip,
        hasMore: totalCalls > (skip + limit)
      })
    );
    
  } catch (error) {
    console.error('Error in getUserCalls:', error);
    return res.status(500).json(
      formatError('Failed to retrieve calls', 500, error.message)
    );
  }
};

/**
 * GET /api/calls/stats/:userId
 * Get call statistics for a user
 */
const getCallStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await Call.getUserCallStats(userId);
    
    return res.status(200).json(
      formatResponse(true, 'Call statistics retrieved successfully', { stats })
    );
    
  } catch (error) {
    console.error('Error in getCallStats:', error);
    return res.status(500).json(
      formatError('Failed to retrieve call statistics', 500, error.message)
    );
  }
};

module.exports = {
  analyzeCall,
  getCallById,
  getUserCalls,
  getCallStats
};
