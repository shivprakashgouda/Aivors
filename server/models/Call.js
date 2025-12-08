const mongoose = require('mongoose');

/**
 * Call Model
 * Stores call analytics data from Retell AI
 */
const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  // Call details
  phoneNumber: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: Number,
    required: true,
    min: 0
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  // AI Analysis
  transcript: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  // Metadata from Retell AI
  eventType: {
    type: String,
    default: 'call_analyze'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Call status
  status: {
    type: String,
    enum: ['completed', 'failed', 'processing'],
    default: 'completed'
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  callStartTime: {
    type: Date
  },
  callEndTime: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Static method: Check if call already exists (prevent duplicates)
 */
callSchema.statics.callExists = async function(callId) {
  const count = await this.countDocuments({ callId });
  return count > 0;
};

/**
 * Static method: Get total minutes used by user
 */
callSchema.statics.getTotalMinutesByUser = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } }
  ]);
  return result.length > 0 ? result[0].totalMinutes : 0;
};

/**
 * Static method: Get call statistics for user
 */
callSchema.statics.getUserCallStats = async function(userId) {
  const [stats] = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        totalMinutes: { $sum: '$durationMinutes' },
        totalSeconds: { $sum: '$durationSeconds' },
        avgDuration: { $avg: '$durationMinutes' }
      }
    }
  ]);
  
  return stats || {
    totalCalls: 0,
    totalMinutes: 0,
    totalSeconds: 0,
    avgDuration: 0
  };
};

// Indexes for faster queries
// Note: callId already has unique: true which creates an index automatically
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ createdAt: -1 });
callSchema.index({ status: 1 });

module.exports = mongoose.model('Call', callSchema);
