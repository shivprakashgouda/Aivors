const mongoose = require('mongoose');

/**
 * Call Model - Updated for email-based user identification
 * Stores call analytics data from Retell AI
 * Email is the PRIMARY user identifier
 */
const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    default: ''
  },
  transcript: {
    type: String,
    default: ''
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  eventType: {
    type: String,
    default: 'call_completed'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Legacy fields for backward compatibility (optional)
  userId: {
    type: String,
    ref: 'User'
  },
  durationMinutes: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'processing'],
    default: 'completed'
  },
  callStartTime: {
    type: Date
  },
  callEndTime: {
    type: Date
  }
}, {
  timestamps: false // Using createdAt manually
});

// Compound index for efficient queries by email + date
callSchema.index({ email: 1, createdAt: -1 });

// Prevent duplicate callId inserts
callSchema.index({ callId: 1 }, { unique: true });

/**
 * Static method: Check if call already exists (prevent duplicates)
 */
callSchema.statics.callExists = async function(callId) {
  const count = await this.countDocuments({ callId });
  return count > 0;
};

/**
 * Static method: Get total minutes used by email
 */
callSchema.statics.getTotalMinutesByEmail = async function(email) {
  const result = await this.aggregate([
    { $match: { email: email.toLowerCase() } },
    { $group: { _id: null, totalSeconds: { $sum: '$durationSeconds' } } }
  ]);
  const totalSeconds = result.length > 0 ? result[0].totalSeconds : 0;
  return Math.ceil(totalSeconds / 60);
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
