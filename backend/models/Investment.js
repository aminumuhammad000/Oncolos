const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  planPrice: {
    type: Number,
    required: true
  },
  dailyIncome: {
    type: Number,
    required: true
  },
  totalDays: {
    type: Number,
    default: 60
  },
  daysElapsed: {
    type: Number,
    default: 0
  },
  earned: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Running', 'Completed'],
    default: 'Running'
  },
  lastPayoutAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);
