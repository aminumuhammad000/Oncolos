const User = require('../models/User');
const Settings = require('../models/Settings');
const { createVirtualAccount, getBanks, verifyBankAccount } = require('../utils/vtstack');

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
    let fallbackUsed = false;

    try {
        // Strictly use VTStack only as requested
        vtResponse = await createVirtualAccount({
            _id: user._id,
            firstName,
            lastName,
            email: user.email,
            phone: user.phone,
            bvn: user.bvn || undefined
        });

        if (vtResponse && (vtResponse.status === 'success' || vtResponse.status === true)) {
            const { accountNumber, bankName, accountName } = vtResponse.data;
            user.virtualAccount = {
                number: accountNumber,
                bank: bankName,
                name: accountName
            };
            await user.save();
        } else {
            console.log('VTStack Creation Failed. Response:', vtResponse);
            return res.status(vtResponse?.statusCode || 400).json({ 
                success: false, 
                message: vtResponse?.message || 'VTStack failed to generate account. Please check your BVN and API keys.' 
            });
        }
    } catch (vtErr) {
        console.error('VTStack API Error:', vtErr.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Virtual account provider (VTStack) is currently unavailable.' 
        });
    }

    res.status(200).json({
      success: true,
      message: 'Real virtual account created successfully via VTStack!',
      virtualAccount: user.virtualAccount
    });

  } catch (err) {
    console.error('Account Generation Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getBankList = async (req, res) => {
    try {
        const banks = await getBanks();
        res.status(200).json({ success: true, data: banks });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyBankAccount = async (req, res) => {
    try {
        const { accountNumber, bankCode } = req.body;
        if (!accountNumber || !bankCode) {
            return res.status(400).json({ message: 'Account number and bank code are required' });
        }
        const result = await verifyBankAccount(bankCode, accountNumber);
        // Normalize the response - VTStack may return accountName or account_name
        const rawData = result.data || result;
        const normalized = {
            accountName: rawData.accountName || rawData.account_name || rawData.name || '',
            accountNumber: rawData.accountNumber || rawData.account_number || accountNumber,
            bankName: rawData.bankName || rawData.bank_name || ''
        };
        res.status(200).json({ success: true, data: normalized });
    } catch (err) {
        console.error('Verify Account Error:', err.response?.data || err.message);
        res.status(400).json({ message: err.response?.data?.message || 'Account verification failed. Please check the account number and bank.' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        
        if (!user || !(await user.comparePassword(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, bank, bankCode, accountNumber, accountName } = req.body;
        
        // 1. Check if withdrawals are enabled globally
        const withdrawalSetting = await Settings.findOne({ key: 'isWithdrawalEnabled' });
        if (withdrawalSetting && withdrawalSetting.value === false) {
            return res.status(403).json({ message: 'Withdrawals are currently closed by the administrator. Please try again later.' });
        }

        const feeSetting = await Settings.findOne({ key: 'withdrawalFeePercent' });
        const feePercent = feeSetting ? Number(feeSetting.value) : 15;
        const fee = (amount * feePercent) / 100;
        const netAmount = amount - fee;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        if (amount < 600) {
            return res.status(400).json({ message: 'Minimum withdrawal is ₦600' });
        }

        // 2. Deduct balance and create withdrawal record
        user.balance -= amount;
        await user.save();

        const withdrawal = await require('../models/Withdrawal').create({
            user: user._id,
            amount,
            fee,
            netAmount,
            bank,
            bankCode,
            accountNumber,
            accountName,
            status: 'Pending'
        });

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            withdrawal,
            newBalance: user.balance
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.readMessages = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.messages.forEach(m => m.read = true);
        await user.save();
        
        res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
