const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    index: true,
    // Auto-generate userId from MongoDB _id if not provided
    default: function() {
      return this._id.toString();
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationOTP: {
    type: String,
    default: null,
  },
  otpExpiresAt: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // User account status - represents account state (NOT subscription/payment state)
  // DO NOT use 'paid' here - payment status belongs in subscription.status
  status: {
    type: String,
    enum: ['pending_payment', 'active', 'inactive', 'cancelled', 'blocked'],
    default: 'pending_payment',
  },
  subscription: {
    plan: {
      type: String,
      default: 'Free',
    },
    // Subscription payment status - can include Stripe statuses
    // 'paid' is a valid Stripe status that may come from webhooks
    status: {
      type: String,
      enum: ['active', 'past_due', 'cancelled', 'inactive', 'paid', 'trialing', 'unpaid', 'incomplete'],
      default: 'inactive',
    },
    minutesPurchased: {
      type: Number,
      default: 0,
    },
    minutesRemaining: {
      type: Number,
      default: 0,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
  },
  business: {
    setupStatus: {
      type: String,
      enum: ['incomplete', 'complete'],
      default: 'incomplete',
    },
    aiTrainingStatus: {
      type: String,
      enum: ['incomplete', 'complete'],
      default: 'incomplete',
    },
    posIntegration: {
      type: String,
      enum: ['incomplete', 'complete'],
      default: 'incomplete',
    },
    phoneNumber: {
      type: String,
      default: 'Not Active',
    },
    retellAgentId: {
      type: String,
      default: null,
      index: true, // Index for fast lookups by agent ID
    },
  },
  analytics: {
    callsToday: {
      type: Number,
      default: 0,
    },
    callsChangePercent: {
      type: Number,
      default: 0,
    },
    aiStatus: {
      type: String,
      enum: ['Online', 'Offline', 'Maintenance'],
      default: 'Offline',
    },
    responseTime: {
      type: Number,
      default: 0,
    },
  },
  recentActivity: [{
    text: {
      type: String,
      required: true,
    },
    timeAgo: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

// Indexes
// Email index is already created by 'unique: true' in schema
userSchema.index({ status: 1 });

// Instance method to sanitize user object (remove password)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
