const User = require('../models/User');
const Deposit = require('../models/Deposit');
const { verifyWebhookSignature } = require('../utils/vtstack');
const crypto = require('crypto');

exports.handleDeposit = async (req, res) => {
  const signature = req.headers['x-vtstack-signature'];
  const webhookSecret = process.env.VTSTACK_WEBHOOK_SECRET;

  // Verify signature to prevent spoofing
  if (webhookSecret && !verifyWebhookSignature(req.body, signature, webhookSecret)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { event, data } = req.body;
  console.log(`[VTStack Webhook] Received ${event} for reference: ${data?.reference || 'N/A'}`);

  if (event === 'transaction.deposit' || event === 'charge.success') {
    const { accountNumber, amount, reference, status } = data;
    console.log(`[VTStack Webhook] Processing deposit: ₦${amount} to account ${accountNumber}, status: ${status}`);

    if (status === 'success' || status === 'completed') {
      try {
        const user = await User.findOne({ 'virtualAccount.number': accountNumber });

        if (user) {
          user.balance += amount;
          user.withdrawBalance += amount;
          await user.save();

          await Deposit.create({
            user: user._id,
            amount,
            reference: reference || `VT_${Date.now()}`,
            status: 'Completed'
          });

          console.log(`[VTStack Webhook] SUCCESS: Credited ₦${amount} to user ${user.phone}`);
        } else {
          console.warn(`[VTStack Webhook] FAILED: No user found with account number ${accountNumber}`);
        }
      } catch (err) {
        console.error('[VTStack Webhook] CRITICAL ERROR:', err.message);
      }
    } else {
      console.warn(`[VTStack Webhook] IGNORED: Deposit status is ${status}`);
    }
  } else {
    console.log(`[VTStack Webhook] IGNORED: Event ${event} is not a deposit.`);
  }

  res.status(200).send('OK');
};


