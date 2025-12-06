const mongoose = require('mongoose');

/**
 * Subscription Model
 * Manages user credits and subscription status
 */
const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    ref: 'User'
  },
  totalCredits: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  usedCredits: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  // Plan details
  planName: {
    type: String,
    default: 'Free'
  },
  planType: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  // Subscription status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
    default: 'active'
  },
  // Renewal date
  renewalDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Virtual field: Calculate available credits
 * availableCredits = totalCredits - usedCredits
 */
subscriptionSchema.virtual('availableCredits').get(function() {
  return Math.max(0, this.totalCredits - this.usedCredits);
});

/**
 * Instance method: Check if user has sufficient credits
 */
subscriptionSchema.methods.hasCredits = function(minutesRequired = 0) {
  return this.availableCredits >= minutesRequired;
};

/**
 * Instance method: Check if credits are low (< 5 minutes)
 */
subscriptionSchema.methods.isLowBalance = function() {
  return this.availableCredits < 5 && this.availableCredits > 0;
};

/**
 * Instance method: Check if workflow should stop (0 credits)
 */
subscriptionSchema.methods.shouldStopWorkflow = function() {
  return this.availableCredits <= 0;
};

/**
 * Instance method: Deduct credits after a call
 */
subscriptionSchema.methods.deductCredits = async function(minutes) {
  this.usedCredits += minutes;
  return await this.save();
};

/**
 * Instance method: Add credits to subscription
 */
subscriptionSchema.methods.addCredits = async function(minutes) {
  this.totalCredits += minutes;
  return await this.save();
};

// Ensure virtuals are included in JSON output
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

// Index for faster queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
