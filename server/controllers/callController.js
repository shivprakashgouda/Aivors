/**
 * Call Analytics Controller
 * Handles call data from Retell AI webhooks
 * NOW USES AIRTABLE FOR DATA STORAGE (via n8n)
 */

const { Subscription } = require('../models'); // Call model removed - using Airtable
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
 * NOTE: Call data is now stored in AIRTABLE via n8n webhook, not MongoDB
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
    
    // NOTE: Call data is stored in Airtable via n8n webhook
    // We only process subscription logic here
    logEvent('CALL_DATA_EXTRACTED', { 
      callId: callData.callId, 
      userId: callData.userId,
      durationMinutes: callData.durationMinutes,
      note: 'Call stored in Airtable via n8n'
    });
    
    // Get subscription info
    const subscription = await getOrCreateSubscription(Subscription, callData.userId);
    const subscriptionFlags = getSubscriptionFlags(subscription.availableCredits);
    
    // Prepare response for n8n
    const responseData = {
      call: {
        callId: callData.callId,
        userId: callData.userId,
        phoneNumber: callData.phoneNumber,
        durationMinutes: callData.durationMinutes,
        durationSeconds: callData.durationSeconds,
        transcriptLength: callData.transcript?.length || 0,
        summaryLength: callData.summary?.length || 0,
        dataSource: 'airtable'
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
        durationMinutes: callData.durationMinutes,
        userId: callData.userId,
        shouldStoreInAirtable: true
      }
    };
    
    logEvent('CALL_ANALYZE_SUCCESS', responseData);
    
    return res.status(201).json(
      formatResponse(true, 'Call analyzed successfully (stored in Airtable via n8n)', responseData)
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
 * NOW FETCHES FROM AIRTABLE
 */
const getCallById = async (req, res) => {
  try {
    const { callId } = req.params;
    
    console.log(`📞 Fetching call from Airtable: ${callId}`);
    
    // Import Airtable service
    const { getAirtableRecords } = require('../services/airtableService');
    
    // Get all records and find matching callId (Airtable record ID)
    const result = await getAirtableRecords({});
    const record = result.records.find(r => r.id === callId);
    
    if (!record) {
      return res.status(404).json(
        formatError('Call not found in Airtable', 404)
      );
    }
    
    const fields = record.fields;
    
    // Format call data
    const call = {
      callId: record.id,
      userId: fields.owner_id || fields.userId,
      phoneNumber: fields.phone_number || fields.phoneNumber || fields.phone || 'N/A',
      durationMinutes: parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0),
      durationSeconds: parseFloat(fields.duration_seconds || fields.durationSeconds || 0),
      transcript: fields.transcript || 'No transcript available',
      summary: fields.summary || fields.notes || 'No summary available',
      createdAt: record.createdTime,
      status: fields.status || fields.call_status || 'completed',
      metadata: fields.metadata || {},
      allFields: fields
    };
    
    console.log(`✅ Call retrieved from Airtable`);
    
    return res.status(200).json(
      formatResponse(true, 'Call retrieved successfully from Airtable', { call })
    );
    
  } catch (error) {
    console.error('❌ Error in getCallById:', error);
    return res.status(500).json(
      formatError('Failed to retrieve call from Airtable', 500, error.message)
    );
  }
};

/**
 * GET /api/calls/user/:userId
 * Get all calls for a specific user
 * NOW FETCHES FROM AIRTABLE
 */
const getUserCalls = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    console.log(`📊 Fetching calls from Airtable for user: ${userId}`);
    
    // Import Airtable service
    const { getAllRecordsByUserId } = require('../services/airtableService');
    
    // Get all records for this user from Airtable
    const airtableRecords = await getAllRecordsByUserId(userId);
    
    // Sort by date (newest first)
    const sortedRecords = airtableRecords.sort((a, b) => 
      new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    );
    
    // Apply pagination
    const paginatedRecords = sortedRecords.slice(skip, skip + limit);
    
    // Format calls
    const calls = paginatedRecords.map(record => {
      const fields = record.fields;
      return {
        callId: record.id,
        userId: fields.owner_id || fields.userId,
        phoneNumber: fields.phone_number || fields.phoneNumber || fields.phone || 'N/A',
        durationMinutes: parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0),
        durationSeconds: parseFloat(fields.duration_seconds || fields.durationSeconds || 0),
        transcript: fields.transcript || '',
        summary: fields.summary || fields.notes || '',
        createdAt: record.createdTime,
        status: fields.status || fields.call_status || 'completed',
        metadata: fields.metadata || {},
        allFields: fields
      };
    });
    
    const totalCalls = sortedRecords.length;
    
    console.log(`✅ Retrieved ${calls.length} calls from Airtable (${totalCalls} total)`);
    
    return res.status(200).json(
      formatResponse(true, 'Calls retrieved successfully from Airtable', {
        calls,
        totalCalls,
        limit,
        skip,
        hasMore: totalCalls > (skip + limit)
      })
    );
    
  } catch (error) {
    console.error('❌ Error in getUserCalls:', error);
    return res.status(500).json(
      formatError('Failed to retrieve calls from Airtable', 500, error.message)
    );
  }
};

/**
 * GET /api/calls/stats/:userId
 * Get call statistics for a user
 * NOW USES AIRTABLE DATA
 */
const getCallStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📈 Calculating stats from Airtable for user: ${userId}`);
    
    // Import Airtable service
    const { getAllRecordsByUserId } = require('../services/airtableService');
    
    // Get all records for this user from Airtable
    const airtableRecords = await getAllRecordsByUserId(userId);
    
    // Calculate statistics
    let totalMinutes = 0;
    let totalSeconds = 0;
    
    airtableRecords.forEach(record => {
      const fields = record.fields;
      const minutes = parseFloat(fields.duration_minutes || fields.durationMinutes || fields.duration || 0);
      const seconds = parseFloat(fields.duration_seconds || fields.durationSeconds || minutes * 60 || 0);
      
      totalMinutes += minutes;
      totalSeconds += seconds;
    });
    
    const stats = {
      totalCalls: airtableRecords.length,
      totalMinutes: Math.round(totalMinutes * 100) / 100,
      totalSeconds: Math.round(totalSeconds),
      averageDuration: airtableRecords.length > 0 
        ? Math.round((totalMinutes / airtableRecords.length) * 100) / 100
        : 0,
      dataSource: 'airtable'
    };
    
    console.log(`✅ Stats calculated from Airtable: ${stats.totalCalls} calls, ${stats.totalMinutes} minutes`);
    
    return res.status(200).json(
      formatResponse(true, 'Call statistics retrieved successfully from Airtable', { stats })
    );
    
  } catch (error) {
    console.error('❌ Error in getCallStats:', error);
    return res.status(500).json(
      formatError('Failed to retrieve call statistics from Airtable', 500, error.message)
    );
  }
};

module.exports = {
  analyzeCall,
  getCallById,
  getUserCalls,
  getCallStats
};
