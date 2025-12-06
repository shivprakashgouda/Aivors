/**
 * Utility Functions for Aivors Backend
 */

/**
 * Convert seconds to minutes (rounded up)
 * @param {number} seconds - Duration in seconds
 * @returns {number} Duration in minutes (rounded up)
 */
const secondsToMinutes = (seconds) => {
  if (!seconds || seconds <= 0) return 0;
  return Math.ceil(seconds / 60);
};

/**
 * Check if call ID already exists in database
 * @param {string} callId - Call ID from Retell AI
 * @returns {Promise<boolean>} True if call exists
 */
const isDuplicateCall = async (Call, callId) => {
  try {
    return await Call.callExists(callId);
  } catch (error) {
    console.error('Error checking duplicate call:', error);
    throw error;
  }
};

/**
 * Validate required fields in request body
 * @param {object} body - Request body
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} { isValid: boolean, missingFields: string[] }
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Format API response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {object} data - Response data
 * @returns {object} Formatted response
 */
const formatResponse = (success, message, data = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} details - Additional error details
 * @returns {object} Formatted error response
 */
const formatError = (message, statusCode = 500, details = null) => {
  const error = {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    error.details = details;
  }
  
  return error;
};

/**
 * Calculate subscription status flags
 * @param {number} availableCredits - Available credits in minutes
 * @returns {object} Status flags
 */
const getSubscriptionFlags = (availableCredits) => {
  return {
    lowBalance: availableCredits < 5 && availableCredits > 0,
    stopWorkflow: availableCredits <= 0,
    creditsRemaining: availableCredits
  };
};

/**
 * Parse duration from Retell AI event
 * @param {object} event - Retell AI event object
 * @returns {object} { durationSeconds, durationMinutes }
 */
const parseDuration = (event) => {
  const durationSeconds = event.duration_seconds || event.durationSeconds || 0;
  const durationMinutes = secondsToMinutes(durationSeconds);
  
  return {
    durationSeconds,
    durationMinutes
  };
};

/**
 * Extract call data from Retell AI webhook
 * @param {object} event - Retell AI event object
 * @returns {object} Formatted call data
 */
const extractCallData = (event) => {
  const { durationSeconds, durationMinutes } = parseDuration(event);
  
  return {
    callId: event.call_id || event.callId,
    userId: event.user_id || event.userId,
    phoneNumber: event.phone_number || event.phoneNumber || 'Unknown',
    durationSeconds,
    durationMinutes,
    transcript: event.transcript || '',
    summary: event.summary || '',
    eventType: event.event_type || event.eventType || 'call_analyze',
    metadata: event.metadata || {},
    callStartTime: event.call_start_time || event.callStartTime,
    callEndTime: event.call_end_time || event.callEndTime
  };
};

/**
 * Validate event type (should be "call_analyze")
 * @param {object} event - Retell AI event object
 * @returns {boolean} True if event_type is "call_analyze"
 */
const isCallAnalyzeEvent = (event) => {
  const eventType = event.event_type || event.eventType;
  return eventType === 'call_analyze';
};

/**
 * Create or get user subscription
 * @param {string} userId - User ID
 * @param {object} Subscription - Subscription model
 * @returns {Promise<object>} Subscription document
 */
const getOrCreateSubscription = async (Subscription, userId) => {
  try {
    let subscription = await Subscription.findOne({ userId });
    
    // Create new subscription if not exists
    if (!subscription) {
      subscription = await Subscription.create({
        userId,
        totalCredits: 0,
        usedCredits: 0,
        status: 'active'
      });
    }
    
    return subscription;
  } catch (error) {
    console.error('Error getting/creating subscription:', error);
    throw error;
  }
};

/**
 * Log important events
 * @param {string} type - Event type
 * @param {object} data - Event data
 */
const logEvent = (type, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}]`, JSON.stringify(data, null, 2));
};

module.exports = {
  secondsToMinutes,
  isDuplicateCall,
  validateRequiredFields,
  formatResponse,
  formatError,
  getSubscriptionFlags,
  parseDuration,
  extractCallData,
  isCallAnalyzeEvent,
  getOrCreateSubscription,
  logEvent
};
