const Investment = require('../models/Investment');
const User = require('../models/User');

const distributeCommissions = async (user, amount) => {
    // Level 1: 20%
    // Level 2: 2%
    // Level 3: 1%
    const levels = [
        { percentage: 0.20, level: 1 },
        { percentage: 0.02, level: 2 },
        { percentage: 0.01, level: 3 }
    ];

    let currentReferredBy = user.referredBy;
    let currentUserPhone = user.phone;

    for (const config of levels) {
        if (!currentReferredBy) break;

        const parent = await User.findOne({ referralCode: currentReferredBy });
        if (!parent) break;

        const commission = amount * config.percentage;
        parent.balance += commission;
        parent.withdrawBalance += commission;
        parent.referralRewards += commission;

        // Record in earnings history
        parent.earningsHistory.push({
            id: Date.now().toString() + config.level,
            type: 'Referral Bonus',
            amount: commission,
            plan: `Level ${config.level} (${currentUserPhone})`,
            date: new Date().toLocaleDateString(),
            rawDate: new Date(),
            status: 'Completed'
        });

        // If this is Level 1, update the invited user status to 'Active'
        if (config.level === 1) {
            const inviteIndex = parent.invitedUsers.findIndex(u => u.phone === currentUserPhone);
            if (inviteIndex !== -1) {
                parent.invitedUsers[inviteIndex].status = 'Active';
            }
        }

        await parent.save();

        // Move to next level up
        currentReferredBy = parent.referredBy;
        currentUserPhone = parent.phone;
    }
};

exports.buyInvestment = async (req, res) => {
  try {
    const { planPrice, dailyIncome } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.balance < planPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const investment = await Investment.create({
      user: user._id,
      planPrice,
      dailyIncome,
      totalDays: 60,
      daysElapsed: 0,
      earned: 0
    });

    // Also push to user's local array for quick dashboard viewing
    user.activeInvestments.push(investment);
    user.balance -= planPrice;
    user.withdrawBalance -= planPrice;
    user.hasInvested = true;
    await user.save();

    // Distribute Commissions
    await distributeCommissions(user, planPrice);

    res.status(201).json({
      success: true,
      data: investment,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
