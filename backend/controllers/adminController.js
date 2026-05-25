const User = require('../models/User');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const Settings = require('../models/Settings');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeInvestments = await Investment.countDocuments({ status: 'Running' });
    const users = await User.find();
    const totalBalance = users.reduce((acc, user) => acc + (user.balance || 0), 0);
    
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeInvestments,
        totalBalance,
        pendingWithdrawals
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
    const defaults = { isDailyBonusEnabled: true };
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

    const withdrawal = await Withdrawal.findByIdAndUpdate(id, { status }, { new: true });
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    res.status(200).json({ success: true, message: `Withdrawal ${status.toLowerCase()} successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
