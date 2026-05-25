const User = require('../models/User');
const Settings = require('../models/Settings');

exports.claimDailyBonus = async (req, res) => {
  try {
    // 1. Check if global bonus is enabled
    const bonusToggle = await Settings.findOne({ key: 'isDailyBonusEnabled' });
    if (bonusToggle && bonusToggle.value === false) {
      return res.status(400).json({ message: 'Daily bonus is currently disabled by admin.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Check if claimed in last 23 hours
    if (user.lastClaimed) {
      const hoursSinceClaim = (new Date() - new Date(user.lastClaimed)) / (1000 * 60 * 60);
      if (hoursSinceClaim < 23) {
        return res.status(400).json({ message: 'You have already claimed your bonus recently. Please come back after 23 hours.' });
      }
    }

    const bonus = 30;
    user.balance += bonus;
    user.lastClaimed = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Daily bonus of ₦${bonus} claimed!`,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.generateVirtualAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.virtualAccount && user.virtualAccount.number) {
      return res.status(400).json({ message: 'You already have a virtual account.' });
    }

    // Build the account name using the user's name or phone
    const displayName = user.name && user.name !== 'User'
      ? user.name.toUpperCase()
      : (user.phone || user.email || 'USER');

    const accountNumber = '904' + Math.floor(1000000 + Math.random() * 9000000);

    user.virtualAccount = {
      number: accountNumber,
      bank: 'PalmPay',
      name: 'ONC-' + displayName
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Virtual account created successfully!',
      virtualAccount: user.virtualAccount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
