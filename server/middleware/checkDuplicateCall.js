/**
 * Duplicate Call Detection Middleware
 * Prevents processing the same call_id multiple times
 */

const { Call } = require('../models');
const { formatError } = require('../utils/helpers');

/**
 * Middleware to check if call already exists in database
 */
const checkDuplicateCall = async (req, res, next) => {
  try {
    const callId = req.body.call_id || req.body.callId;
    
    if (!callId) {
      return res.status(400).json(
        formatError('Missing call_id in request', 400)
      );
    }
    
    // Check if call already exists
    const exists = await Call.callExists(callId);
    
    if (exists) {
      console.log(`[DUPLICATE] Call ${callId} already processed. Skipping.`);
      return res.status(200).json({
        success: true,
        message: 'Call already processed',
        duplicate: true,
        callId
      });
    }
    
    // Call doesn't exist, proceed to next middleware
    next();
  } catch (error) {
    console.error('Error in duplicate check middleware:', error);
    return res.status(500).json(
      formatError('Error checking duplicate call', 500, error.message)
    );
  }
};

module.exports = checkDuplicateCall;
