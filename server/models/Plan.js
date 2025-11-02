const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  priceMonthly: {
    type: Number,
    required: true, // in paise/cents
  },
  stripePriceId: {
    type: String,
    default: null,
  },
  minutes: {
    type: Number,
    required: true,
  },
  features: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

planSchema.index({ name: 1 }, { unique: true });
planSchema.index({ isActive: 1 });

module.exports = mongoose.model('Plan', planSchema);
