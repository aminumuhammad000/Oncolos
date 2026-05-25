const User = require('../models/User');
const { verifyWebhookSignature } = require('../utils/vtstack');

exports.handleDeposit = async (req, res) => {
  const signature = req.headers['x-vtstack-signature'];
  const webhookSecret = process.env.VTSTACK_WEBHOOK_SECRET;

  // Verify signature to prevent spoofing
  if (webhookSecret && !verifyWebhookSignature(req.body, signature, webhookSecret)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { event, data } = req.body;

  if (event === 'transaction.deposit') {
    const { accountNumber, amount, reference, status } = data;

    if (status === 'success') {
      try {
        // Find user by virtual account number
        const user = await User.findOne({ 'virtualAccount.number': accountNumber });
        
        if (user) {
          user.balance += amount;
          user.withdrawBalance += amount; // Assuming incoming funds are withdrawable
          
          // Log earnings
          // ... implementation for recording transaction history
          
          await user.save();
          console.log(`Successfully credited ${amount} to User: ${user.phone}`);
        }
      } catch (err) {
        console.error('Webhook processing error:', err.message);
      }
    }
  }

  // Always return 200 to acknowledge receipt
  res.status(200).send('OK');
};
