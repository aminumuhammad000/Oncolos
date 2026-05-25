const Investment = require('../models/Investment');
const User = require('../models/User');

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
    await user.save();

    res.status(201).json({
      success: true,
      data: investment,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
