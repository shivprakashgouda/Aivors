/**
 * Duplicate Call Detection Middleware
 * Prevents processing the same call_id multiple times
 * NOW CHECKS AIRTABLE INSTEAD OF MONGODB
 */

const { getAirtableRecords } = require('../services/airtableService');
const { formatError } = require('../utils/helpers');

/**
 * Middleware to check if call already exists in Airtable
 */
const checkDuplicateCall = async (req, res, next) => {
  try {
    const callId = req.body.call_id || req.body.callId;
    
    if (!callId) {
      return res.status(400).json(
        formatError('Missing call_id in request', 400)
      );
    }
    
    // Check if call already exists in Airtable
    // Search for records with matching call_id or callId field
    const filterFormula = `OR({call_id} = '${callId}', {callId} = '${callId}')`;
    
    const result = await getAirtableRecords({
      filterByFormula: filterFormula,
      maxRecords: 1
    });
    
    if (result.records && result.records.length > 0) {
      console.log(`[DUPLICATE] Call ${callId} already in Airtable (record ${result.records[0].id}). Skipping.`);
      return res.status(200).json({
        success: true,
        message: 'Call already processed in Airtable',
        duplicate: true,
        callId,
        airtableRecordId: result.records[0].id
      });
    }
    
    // Call doesn't exist, proceed to next middleware
    console.log(`[NEW CALL] ${callId} not found in Airtable, proceeding...`);
    next();
  } catch (error) {
    console.error('Error in duplicate check middleware (Airtable):', error);
    // Don't block on error - let the call through
    console.warn('[WARNING] Duplicate check failed, allowing call through');
    next();
  }
};

module.exports = checkDuplicateCall;
