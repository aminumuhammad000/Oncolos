const User = require('../models/User');
const Settings = require('../models/Settings');
const Promotion = require('../models/Promotion');
const { createVirtualAccount, getBanks, verifyBankAccount, initiatePayout } = require('../utils/vtstack');

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

        const amountSetting = await Settings.findOne({ key: 'dailyBonusAmount' });
        const bonus = amountSetting ? Number(amountSetting.value) : 30;
        user.balance += bonus;
        user.withdrawBalance += bonus;
        user.lastClaimed = new Date();

        user.earningsHistory.push({
            id: Date.now().toString(),
            type: 'Daily Reward',
            amount: bonus,
            plan: 'System Bonus',
            date: new Date().toLocaleDateString(),
            rawDate: new Date(),
            status: 'Completed'
        });

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
        const errorMsg = err.response?.status ? `VTStack API Error ${err.response.status}` : err.message;
        console.warn('Verify Account Warning:', errorMsg);

        // Check if it's a 502/504/Timeout (Service Down)
        const isDown = err.response?.status >= 500 || err.code === 'ECONNABORTED' || err.message.includes('timeout');

        if (isDown) {
            return res.status(200).json({
                success: true,
                data: {
                    accountName: 'SERVICE_UNAVAILABLE',
                    accountNumber: accountNumber,
                    bankName: ''
                },
                message: 'Service is currently slow. Please enter your name manually.'
            });
        }

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

        const minWithdrawSetting = await Settings.findOne({ key: 'minWithdrawalAmount' });
        const minWithdrawalAmount = minWithdrawSetting ? Number(minWithdrawSetting.value) : 600;

        // No withdrawal fees — users receive the full amount they request
        const feePercent = 0;
        const percentFee = 0;
        const processingFee = 0;
        const fee = 0;
        const netAmount = amount;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        if (amount < minWithdrawalAmount) {
            return res.status(400).json({ message: `Minimum withdrawal is ₦${minWithdrawalAmount}` });
        }

        // Must have at least one investment to activate withdrawals
        if (!user.hasInvested) {
            return res.status(403).json({
                message: 'Activation Required: You must have at least one active investment before you can withdraw your funds.'
            });
        }

        // Deduct balance immediately
        user.balance -= amount;
        user.withdrawBalance -= amount;

        // Push to earnings history for visibility in the Earning Page
        const historyId = Date.now().toString();
        user.earningsHistory.unshift({
            id: historyId,
            type: 'Withdrawal',
            amount: amount,
            plan: `${bank} • ${accountNumber}`,
            date: new Date().toLocaleDateString(),
            rawDate: new Date(),
            status: 'Pending'
        });

        // Save bank details for next time
        user.savedBankDetails = { bank, bankCode, accountNumber, accountName };

        // Also push to savedBankAccounts array (max 5, deduped by accountNumber)
        const alreadySaved = user.savedBankAccounts.some(a => a.accountNumber === accountNumber);
        if (!alreadySaved) {
            user.savedBankAccounts.push({ bank, bankCode, accountNumber, accountName });
            if (user.savedBankAccounts.length > 5) user.savedBankAccounts.shift();
        }

        await user.save();

        // Create withdrawal record as Pending first
        const Withdrawal = require('../models/Withdrawal');
        const withdrawal = await Withdrawal.create({
            user: user._id,
            amount,
            fee,
            serviceFee: percentFee,
            processingFee: processingFee,
            netAmount,
            bank,
            bankCode,
            accountNumber,
            accountName,
            status: 'Pending'
        });

        // Attempt automatic payout via VTStack immediately
        try {
            // User receives: amount - our_fee - gateway_fee
            // We send to VTStack: amount - our_fee
            // VTStack then deducts: gateway_fee
            const payoutResult = await initiatePayout({
                amount: amount,   // naira — full amount, no fees deducted
                bankCode,
                accountNumber,
                accountName,
                narration: `Oncolous withdrawal - ${user.phone}`
            });

            // Payout succeeded — update withdrawal status to Paid
            const payoutRef = payoutResult?.data?.reference || payoutResult?.data?.externalRef;
            withdrawal.status = 'Paid';
            withdrawal.vtPayoutRef = payoutRef || null;
            await withdrawal.save();

            // Update status in earnings history
            const histEntry = user.earningsHistory.find(h => h.id === historyId);
            if (histEntry) histEntry.status = 'Completed';
            await user.save();

            console.log(`[Withdrawal] Auto-payout SUCCESS for user ${user.phone}. Ref: ${payoutRef}`);

            return res.status(201).json({
                success: true,
                message: `Your withdrawal of ₦${amount.toLocaleString()} has been processed successfully. You will receive the full amount of ₦${netAmount.toLocaleString()} — no fees charged.`,
                data: { withdrawal, user },
                newBalance: user.balance
            });

        } catch (payoutErr) {
            // Payout failed — REFUND the user's balance so no money is lost
            const errMsg = payoutErr.response?.data?.message || payoutErr.message;
            console.error(`[Withdrawal] Auto-payout FAILED for user ${user.phone}:`, errMsg, '— refunding balance');

            user.balance += amount;
            user.withdrawBalance += amount;

            // Update status in earnings history to Rejected or Refunded
            const histEntry = user.earningsHistory.find(h => h.id === historyId);
            if (histEntry) histEntry.status = 'Rejected';

            await user.save();

            // Mark withdrawal as rejected with reason
            withdrawal.status = 'Rejected';
            await withdrawal.save();

            return res.status(400).json({
                message: `Withdrawal failed: ${errMsg}. Your balance has been refunded. Please try again or contact support.`
            });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.redeemCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Code is required' });

        const promo = await Promotion.findOne({ promoCode: code.toUpperCase(), isActive: true });
        if (!promo) return res.status(404).json({ message: 'Invalid or expired gift code' });

        if (promo.maxRedemptions > 0 && promo.totalRedeemed >= promo.maxRedemptions) {
            return res.status(400).json({ message: 'This gift code has reached its maximum redemptions' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if user already redeemed this specific code (optional, but good practice)
        const alreadyRedeemed = user.earningsHistory.some(h => h.plan === `Gift Code: ${code.toUpperCase()}`);
        if (alreadyRedeemed) {
            return res.status(400).json({ message: 'You have already redeemed this gift code' });
        }

        const bonus = promo.bonusAmount || 0;
        user.balance += bonus;
        user.withdrawBalance += bonus;

        user.earningsHistory.push({
            id: Date.now().toString(),
            type: 'Gift Reward',
            amount: bonus,
            plan: `Gift Code: ${code.toUpperCase()}`,
            date: new Date().toLocaleDateString(),
            rawDate: new Date(),
            status: 'Completed'
        });

        promo.totalRedeemed += 1;
        await promo.save();
        await user.save();

        res.status(200).json({
            success: true,
            message: `Congratulations! You received ₦${bonus.toLocaleString()} bonus.`,
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

exports.saveBankAccount = async (req, res) => {
    try {
        const { bank, bankCode, accountNumber, accountName } = req.body;
        if (!bank || !bankCode || !accountNumber || !accountName) {
            return res.status(400).json({ message: 'All bank details are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Dedup by accountNumber
        const already = user.savedBankAccounts.some(a => a.accountNumber === accountNumber);
        if (already) {
            return res.status(400).json({ message: 'This account is already saved' });
        }

        user.savedBankAccounts.push({ bank, bankCode, accountNumber, accountName });
        if (user.savedBankAccounts.length > 5) user.savedBankAccounts.shift();
        await user.save();

        res.status(200).json({ success: true, message: 'Bank account saved', data: user.savedBankAccounts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.removeBankAccount = async (req, res) => {
    try {
        const { index } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const idx = parseInt(index, 10);
        if (isNaN(idx) || idx < 0 || idx >= user.savedBankAccounts.length) {
            return res.status(400).json({ message: 'Invalid account index' });
        }

        user.savedBankAccounts.splice(idx, 1);
        await user.save();

        res.status(200).json({ success: true, message: 'Bank account removed', data: user.savedBankAccounts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
