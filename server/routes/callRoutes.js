/**
 * Call Routes
 * Routes for call analytics endpoints
 */

const express = require('express');
const router = express.Router();
const {
  analyzeCall,
  getCallById,
  getUserCalls,
  getCallStats
} = require('../controllers/callController');

// Middleware
const validateEventType = require('../middleware/validateEventType');
const checkDuplicateCall = require('../middleware/checkDuplicateCall');

/**
 * POST /api/calls/analyze
 * Process call_analyze event from Retell AI (via n8n webhook)
 * Middleware: validateEventType, checkDuplicateCall
 */
router.post('/analyze', validateEventType, checkDuplicateCall, analyzeCall);

/**
 * GET /api/calls/:callId
 * Get details of a specific call
 */
router.get('/:callId', getCallById);

/**
 * GET /api/calls/user/:userId
 * Get all calls for a specific user
 * Query params: limit (default 50), skip (default 0)
 */
router.get('/user/:userId', getUserCalls);

/**
 * GET /api/calls/stats/:userId
 * Get call statistics for a user
 */
router.get('/stats/:userId', getCallStats);

module.exports = router;
