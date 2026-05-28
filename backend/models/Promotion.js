const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['Popup', 'Banner', 'News'],
    default: 'News'
  },
  // Redeemable promo code fields
  promoCode: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  maxRedemptions: {
    type: Number,
    default: 0  // 0 = unlimited
  },
  totalRedeemed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
