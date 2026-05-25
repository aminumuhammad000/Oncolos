const User = require('../models/User');
const Settings = require('../models/Settings');
const { createVirtualAccount } = require('../utils/vtstack');

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

    // Prepare data for VTStack
    const displayName = user.name || 'User';
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Call VTStack to create real virtual account
    let vtResponse;
    try {
        vtResponse = await createVirtualAccount({
            _id: user._id,
            firstName,
            lastName,
            email: user.email,
            phone: user.phone,
            bvn: user.bvn || undefined // Use user's BVN if exists
        });
    } catch (vtErr) {
        // Log detailed error for admin
        console.error('VTStack Error:', vtErr.response?.data || vtErr.message);
        
        // Return a cleaner error message to user
        const errMsg = vtErr.response?.data?.message || vtErr.message || 'Failed to generate account with provider';
        return res.status(400).json({ 
            message: `Provider Error: ${errMsg}. Please ensure your profile is complete or contact support.` 
        });
    }

    if (vtResponse && vtResponse.status === 'success') {
      const { accountNumber, bankName, accountName } = vtResponse.data;
      
      user.virtualAccount = {
        number: accountNumber,
        bank: bankName,
        name: accountName
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Real virtual account created successfully!',
        virtualAccount: user.virtualAccount
      });
    } else {
      // Fallback for unexpected success-false or missing data
      throw new Error('Provider did not return account details.');
    }

  } catch (err) {
    console.error('Account Generation Error:', err);
    res.status(500).json({ message: err.message });
  }
};

