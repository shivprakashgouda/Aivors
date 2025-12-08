/**
 * Retell Integration Routes
 * Handles Retell AI agent connection and management
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authGuard } = require('../utils/jwt');
const { formatResponse, formatError } = require('../utils/helpers');

/**
 * POST /api/retell/connect-agent
 * Connect a Retell agent to the authenticated user's account
 * Body: { agentId: string }
 */
router.post('/connect-agent', authGuard, async (req, res) => {
  try {
    const { agentId } = req.body;
    const userId = req.user.userId;

    if (!agentId) {
      return res.status(400).json(
        formatError('Missing required field: agentId', 400)
      );
    }

    // Check if agent is already connected to another user
    const existingUser = await User.findOne({ 'business.retellAgentId': agentId });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json(
        formatError('This Retell agent is already connected to another account', 400)
      );
    }

    // Update user with agent ID
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        'business.retellAgentId': agentId,
        'business.aiTrainingStatus': 'complete',
        'analytics.aiStatus': 'Online'
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(
        formatError('User not found', 404)
      );
    }

    console.log(`✅ [RETELL] Agent ${agentId} connected to user ${user.email}`);

    res.json(
      formatResponse('Retell agent connected successfully', {
        agentId,
        email: user.email,
        aiStatus: user.analytics.aiStatus
      })
    );
  } catch (error) {
    console.error('❌ [RETELL] Error connecting agent:', error);
    res.status(500).json(
      formatError('Failed to connect Retell agent', 500, error.message)
    );
  }
});

/**
 * DELETE /api/retell/disconnect-agent
 * Disconnect the Retell agent from the authenticated user's account
 */
router.delete('/disconnect-agent', authGuard, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        'business.retellAgentId': null,
        'analytics.aiStatus': 'Offline'
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(
        formatError('User not found', 404)
      );
    }

    console.log(`🔌 [RETELL] Agent disconnected from user ${user.email}`);

    res.json(
      formatResponse('Retell agent disconnected successfully', {
        aiStatus: user.analytics.aiStatus
      })
    );
  } catch (error) {
    console.error('❌ [RETELL] Error disconnecting agent:', error);
    res.status(500).json(
      formatError('Failed to disconnect Retell agent', 500, error.message)
    );
  }
});

/**
 * GET /api/retell/agent-status
 * Get the current Retell agent connection status
 */
router.get('/agent-status', authGuard, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('business.retellAgentId analytics.aiStatus');

    if (!user) {
      return res.status(404).json(
        formatError('User not found', 404)
      );
    }

    res.json(
      formatResponse('Agent status retrieved', {
        isConnected: !!user.business.retellAgentId,
        agentId: user.business.retellAgentId,
        aiStatus: user.analytics.aiStatus
      })
    );
  } catch (error) {
    console.error('❌ [RETELL] Error getting agent status:', error);
    res.status(500).json(
      formatError('Failed to get agent status', 500, error.message)
    );
  }
});

module.exports = router;
