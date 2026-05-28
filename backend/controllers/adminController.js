const User = require('../models/User');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const Deposit = require('../models/Deposit');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

exports.loginAsUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = signToken(user._id);
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save(); // User model handles hashing via pre-save

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeInvestments = await Investment.countDocuments({ status: 'Running' });
    const users = await User.find();
    const totalBalance = users.reduce((acc, user) => acc + (user.balance || 0), 0);
    
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const pendingWithdrawalsData = await Withdrawal.find({ status: 'Pending' }).populate('user', 'name email phone').sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeInvestments,
        totalBalance,
        pendingWithdrawalsCount: pendingWithdrawals,
        recentUsers,
        pendingWithdrawals: pendingWithdrawalsData
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllInvestments = async (req, res) => {
  try {
    const investments = await Investment.find().populate('user', 'name phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: investments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllReferrals = async (req, res) => {
  try {
    // Basic implementation: find users who have a 'referredBy' field
    const referrals = await User.find({ referredBy: { $ne: null } }).select('name phone referredBy createdAt');
    res.status(200).json({ success: true, data: referrals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    // Default values if not in DB
    const defaults = { 
      isDailyBonusEnabled: true,
      isWelcomeBonusEnabled: true,
      welcomeBonusAmount: 600,
      isWithdrawalEnabled: true,
      withdrawalFeePercent: 15,
      referralL1: 20,
      referralL2: 2,
      referralL3: 1
    };
    const result = { ...defaults };
    settings.forEach(s => result[s.key] = s.value);
    
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('user', 'name phone email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: withdrawals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const withdrawal = await Withdrawal.findById(id).populate('user');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    // Save approval status first — always succeeds
    withdrawal.status = status;
    await withdrawal.save();

    let payoutWarning = null;

    if (status === 'Approved') {
      // Attempt automated payout - non-blocking
      try {
        const { initiatePayout } = require('../utils/vtstack');
        const payoutResult = await initiatePayout({
          amount: withdrawal.netAmount || (withdrawal.amount - withdrawal.fee),
          bankCode: withdrawal.bankCode || '100004',
          accountNumber: withdrawal.accountNumber,
          accountName: withdrawal.accountName,
          narration: `Withdrawal for ${withdrawal.user?.phone || 'User'}`
        });
        console.log('Automated Payout Success:', payoutResult);
      } catch (payoutErr) {
        const errMsg = payoutErr.response?.data?.message || payoutErr.message;
        console.error('Automated Payout Failed (manual transfer required):', errMsg);
        payoutWarning = `Approved in system, but automated bank transfer failed: ${errMsg}. Please process manually.`;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Withdrawal ${status.toLowerCase()} successfully`,
      ...(payoutWarning && { warning: payoutWarning })
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.updateUserKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { kycStatus } = req.body;
    
    if (!['unverified', 'pending', 'verified'].includes(kycStatus)) {
      return res.status(400).json({ message: 'Invalid KYC status' });
    }

    const user = await User.findByIdAndUpdate(id, { kycStatus }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ success: true, message: `User KYC status updated to ${kycStatus}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, action } = req.body; // action: 'add' or 'deduct'
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'add') user.balance += Number(amount);
    else if (action === 'deduct') user.balance -= Number(amount);
    else return res.status(400).json({ message: 'Invalid action' });

    await user.save();
    res.status(200).json({ success: true, message: `Balance updated for ${user.phone}`, newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ success: true, message: `User status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Also delete user's investments and withdrawals for cleanup
    await Investment.deleteMany({ user: id });
    await Withdrawal.deleteMany({ user: id });

    res.status(200).json({ success: true, message: 'User and all related data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const Promotion = require('../models/Promotion');

exports.getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('user', 'name phone email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// VIP Management
exports.getVIPUsers = async (req, res) => {
  try {
    const users = await User.find({ vipLevel: { $gt: 0 } }).sort({ vipLevel: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateVIPLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { vipLevel } = req.body;
    const user = await User.findByIdAndUpdate(id, { vipLevel }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ success: true, message: `VIP level updated to ${vipLevel}`, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Promotion Management
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: promotions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findByIdAndUpdate(id, req.body, { new: true });
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.status(200).json({ success: true, data: promotion });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    await Promotion.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Promotion deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

