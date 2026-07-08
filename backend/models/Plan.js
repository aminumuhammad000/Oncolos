const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true
  },
  daily: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 60
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
