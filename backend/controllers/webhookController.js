const User = require('../models/User');
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

exports.handlePaystackWebhook = async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;

  if (event === 'charge.success') {
    const { amount, customer } = data;
    // Paystack returns amount in kobo
    const realAmount = amount / 100;
    
    // Account number for dedicated accounts
    const accountNumber = data.dedicated_account?.account_number;

    try {
      const user = await User.findOne({ 
          $or: [
              { 'virtualAccount.number': accountNumber },
              { email: customer.email }
          ]
      });

      if (user) {
        user.balance += realAmount;
        // Also add to earnings history
        const newEarning = {
            id: Date.now().toString(),
            type: 'Fund Deposit',
            plan: 'Paystack Transfer',
            amount: realAmount,
            date: new Date().toLocaleDateString(),
            status: 'Completed'
        };
        user.earningsHistory = [newEarning, ...(user.earningsHistory || [])];
        
        await user.save();
        console.log(`Paystack Webhook: Credited ₦${realAmount} to User: ${user.phone}`);
      }
    } catch (err) {
      console.error('Paystack webhook error:', err.message);
    }
  }

  res.status(200).send('OK');
};
