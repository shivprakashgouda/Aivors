const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'USER_CREATED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'OTP_RESENT',
      'EMAIL_VERIFIED',
      'DEMO_BOOKING_VERIFIED',
      'CHECKOUT_CREATED',
      'SUBSCRIPTION_ACTIVATED',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'SUBSCRIPTION_MODIFIED',
      'SUBSCRIPTION_CANCELLED',
      'ADMIN_ACTION',
      'IMPERSONATION_START',
      'IMPERSONATION_END',
      'WEBHOOK_RECEIVED',
    ],
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Index for efficient queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
