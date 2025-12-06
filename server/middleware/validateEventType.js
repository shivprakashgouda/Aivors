/**
 * Event Type Validation Middleware
 * Only processes "call_analyze" events from Retell AI
 */

const { formatError } = require('../utils/helpers');

/**
 * Middleware to validate event_type is "call_analyze"
 * Retell AI sends 3 events per call, but we only want call_analyze
 */
const validateEventType = (req, res, next) => {
  try {
    const eventType = req.body.event_type || req.body.eventType;
    
    if (!eventType) {
      return res.status(400).json(
        formatError('Missing event_type in request', 400)
      );
    }
    
    // Only process "call_analyze" events
    if (eventType !== 'call_analyze') {
      console.log(`[SKIP] Event type "${eventType}" is not "call_analyze". Skipping.`);
      return res.status(200).json({
        success: true,
        message: `Event type "${eventType}" ignored. Only processing "call_analyze" events.`,
        skipped: true,
        eventType
      });
    }
    
    // Event type is valid, proceed
    next();
  } catch (error) {
    console.error('Error in event type validation:', error);
    return res.status(500).json(
      formatError('Error validating event type', 500, error.message)
    );
  }
};

module.exports = validateEventType;
