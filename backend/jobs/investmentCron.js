const cron = require('node-cron');
const Investment = require('../models/Investment');
const User = require('../models/User');

/**
 * Runs every minute to check for investments that have completed a 24-hour cycle.
 * For each investment where 24 hours have passed since lastPayoutAt:
 *  - Increments daysElapsed by 1
 *  - Adds dailyIncome to the user's balance and withdrawBalance
 *  - Updates lastPayoutAt to the current time
 *  - Marks investment as Completed when totalDays are reached
 */
const startInvestmentCron = () => {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find investments that are running and haven't been paid for at least 24 hours
      const activeInvestments = await Investment.find({
        status: 'Running',
        $or: [
          { lastPayoutAt: { $lte: twentyFourHoursAgo } },
          { lastPayoutAt: { $exists: false } } // For legacy investments
        ]
      });

      if (activeInvestments.length > 0) {
        console.log(`[CRON] Found ${activeInvestments.length} investments due for payout at ${now.toISOString()}`);
      }

      for (const inv of activeInvestments) {
        // Determine the baseline for updating the timer. 
        // If lastPayoutAt exists, use it; otherwise fallback to createdAt.
        const baseTime = inv.lastPayoutAt || inv.createdAt || new Date();
        
        inv.daysElapsed += 1;
        inv.earned = (inv.earned || 0) + inv.dailyIncome;
        
        // Advance the lastPayoutAt by exactly 24 hours to prevent drift
        inv.lastPayoutAt = new Date(baseTime.getTime() + 24 * 60 * 60 * 1000);

        if (inv.daysElapsed >= inv.totalDays) {
          inv.status = 'Completed';
        }

        await inv.save();

        // Credit the user's withdrawable balance and log earnings history
        await User.findByIdAndUpdate(inv.user, {
          $inc: { 
            balance: inv.dailyIncome,
            withdrawBalance: inv.dailyIncome 
          },
          $push: {
            earningsHistory: {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              type: 'Investment Returns',
              amount: inv.dailyIncome,
              plan: `₦${(inv.planPrice || 0).toLocaleString()} Plan ROI`,
              date: inv.lastPayoutAt.toLocaleDateString(),
              status: 'Completed'
            }
          }
        });
      }
    } catch (err) {
      console.error('[CRON] Investment processor error:', err.message);
    }
  });

  console.log('[CRON] High-precision investment processor scheduled (runs every minute).');
};

module.exports = { startInvestmentCron };
