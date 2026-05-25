const cron = require('node-cron');
const Investment = require('../models/Investment');
const User = require('../models/User');

/**
 * Runs every day at midnight (00:00).
 * For each active investment:
 *  - Increments daysElapsed by 1
 *  - Adds dailyIncome to the user's withdrawBalance and earned total
 *  - Marks investment as Completed when 60 days are done
 */
const startInvestmentCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily investment processor...');
    try {
      const activeInvestments = await Investment.find({ status: 'Running' });

      for (const inv of activeInvestments) {
        inv.daysElapsed += 1;
        inv.earned = (inv.earned || 0) + inv.dailyIncome;

        if (inv.daysElapsed >= 60) {
          inv.status = 'Completed';
        }

        await inv.save();

        // Credit the user's withdrawable balance
        await User.findByIdAndUpdate(inv.user, {
          $inc: { withdrawBalance: inv.dailyIncome }
        });
      }

      console.log(`[CRON] Processed ${activeInvestments.length} investments.`);
    } catch (err) {
      console.error('[CRON] Investment processor error:', err.message);
    }
  });

  console.log('[CRON] Daily investment processor scheduled.');
};

module.exports = { startInvestmentCron };
