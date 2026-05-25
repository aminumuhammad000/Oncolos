const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  balance: {
    type: Number,
    default: 0
  },
  withdrawBalance: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referralRewards: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Banned'],
    default: 'Active'
  },
  virtualAccount: {
    number: String,
    bank: String,
    name: String
  },
  earningsHistory: {
    type: [{
      id: String,
      type: String,
      amount: Number,
      plan: String,
      date: String
    }],
    default: []
  },
  activeInvestments: {
    type: [Object], // Store snapshots or references
    default: []
  },
  invitedUsers: {
    type: [{
      phone: String,
      date: String,
      status: String
    }],
    default: []
  },
  lastClaimed: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
