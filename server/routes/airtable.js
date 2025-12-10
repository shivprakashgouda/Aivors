/**
 * Airtable Routes
 * 
 * API endpoints for interacting with Airtable data
 * 
 * Endpoints:
 * - GET /api/airtable/:userId - Get all Airtable records for a specific user
 * - POST /api/webhook/airtable - Webhook endpoint for Airtable Automation updates
 */

const express = require('express');
const router = express.Router();
const { getRecordsByUserId, getAllRecordsByUserId } = require('../services/airtableService');

/**
 * GET /api/airtable/:userId
 * 
 * Retrieve all Airtable records filtered by owner_id = userId
 * 
 * Path Parameters:
 * - userId: The user ID to filter records by
 * 
 * Query Parameters (optional):
 * - offset: Pagination offset token from previous response
 * - maxRecords: Maximum number of records to return in one page
 * - all: If 'true', fetch ALL pages automatically (no pagination)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     records: [...],      // Array of Airtable records
 *     offset: "...",       // Next page offset (null if no more pages)
 *     userId: "..."        // The requested user ID
 *   }
 * }
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { offset, maxRecords, all } = req.query;

    console.log(`📊 API Request: GET /api/airtable/${userId}`);
    console.log(`   Query params:`, req.query);

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    let result;

    // If 'all' parameter is true, fetch all pages automatically
    if (all === 'true') {
      console.log('   → Fetching ALL records (automatic pagination)');
      const allRecords = await getAllRecordsByUserId(
        userId,
        maxRecords ? parseInt(maxRecords) : null
      );

      result = {
        records: allRecords,
        offset: null, // No offset when fetching all records
      };
    } else {
      // Fetch single page with optional pagination
      console.log('   → Fetching single page');
      result = await getRecordsByUserId(userId, {
        offset: offset || null,
        maxRecords: maxRecords ? parseInt(maxRecords) : null,
      });
    }

    console.log(`✅ Returning ${result.records.length} records`);

    // Return successful response
    res.json({
      success: true,
      data: {
        records: result.records,
        offset: result.offset,
        userId: userId,
        totalReturned: result.records.length,
        hasMore: !!result.offset, // Boolean indicating if there are more pages
      },
    });

  } catch (error) {
    console.error('❌ Error in GET /api/airtable/:userId:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Airtable records',
    });
  }
});

/**
 * POST /api/webhook/airtable
 * 
 * Webhook endpoint that receives updates from Airtable Automations
 * When Airtable sends an update, this endpoint will:
 * 1. Receive the webhook payload
 * 2. Extract the userId (owner_id) from the payload
 * 3. Emit a real-time update to connected Socket.io clients in that user's room
 * 
 * Expected Webhook Payload from Airtable:
 * {
 *   recordId: "rec...",
 *   owner_id: "user123",
 *   fields: { ... }  // Updated record fields
 * }
 * 
 * This route is registered in index.js and requires Socket.io to be attached to the app
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;

    console.log('🔔 Airtable Webhook Received:', JSON.stringify(payload, null, 2));

    // Extract owner_id (userId) from the payload
    const userId = payload.owner_id || payload.fields?.owner_id;

    if (!userId) {
      console.warn('⚠️  No owner_id found in webhook payload');
      return res.status(400).json({
        success: false,
        error: 'owner_id is required in webhook payload',
      });
    }

    // Get Socket.io instance from app
    // This will be set in index.js: app.set('io', io)
    const io = req.app.get('io');

    if (!io) {
      console.error('❌ Socket.io not initialized on app');
      return res.status(500).json({
        success: false,
        error: 'Real-time updates not configured',
      });
    }

    // Emit update to all clients in this user's room
    const roomName = `user_${userId}`;
    console.log(`📡 Broadcasting to room: ${roomName}`);

    io.to(roomName).emit('airtable_update', {
      type: 'record_updated',
      userId: userId,
      recordId: payload.recordId,
      fields: payload.fields || payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Webhook processed and broadcast to room ${roomName}`);

    // Acknowledge receipt to Airtable
    res.json({
      success: true,
      message: 'Webhook received and processed',
      userId: userId,
      recordId: payload.recordId,
    });

  } catch (error) {
    console.error('❌ Error processing Airtable webhook:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook',
    });
  }
});

/**
 * GET /api/airtable/by-email/:email
 *
 * Retrieve all Airtable records filtered by EMAIL = email
 *
 * Path Parameters:
 * - email: The user email to filter records by
 *
 * Query Parameters (optional):
 * - offset: Pagination offset token from previous response
 * - maxRecords: Maximum number of records to return in one page
 * - all: If 'true', fetch ALL pages automatically (no pagination)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     records: [...],      // Array of Airtable records
 *     offset: "...",       // Next page offset (null if no more pages)
 *     email: "..."         // The requested email
 *   }
 * }
 */
router.get('/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { offset, maxRecords, all } = req.query;

    console.log(`📧 API Request: GET /api/airtable/by-email/${email}`);
    console.log(`   Query params:`, req.query);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'email is required',
      });
    }

    let result;
    const { getRecordsByEmail, getAllRecordsByEmail } = require('../services/airtableService');

    if (all === 'true') {
      console.log('   → Fetching ALL records (automatic pagination)');
      const allRecords = await getAllRecordsByEmail(
        email,
        maxRecords ? parseInt(maxRecords) : null
      );
      result = { records: allRecords, offset: null };
    } else {
      result = await getRecordsByEmail(email, {
        offset,
        maxRecords: maxRecords ? parseInt(maxRecords) : undefined,
      });
    }

    return res.json({
      success: true,
      data: {
        records: result.records,
        offset: result.offset || null,
        email,
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/airtable/by-email/:email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch records by email',
    });
  }
});

module.exports = router;
