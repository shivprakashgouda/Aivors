const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'AI_CALL_MINUTES'
  amount: { type: Number, required: true }, // minutes used or granted
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

usageLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
