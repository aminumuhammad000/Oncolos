const User = require('../models/User');
const Deposit = require('../models/Deposit');
const crypto = require('crypto');

exports.handleDeposit = async (req, res) => {
  // ── Always respond 200 immediately so VTStack doesn't retry ──
  res.status(200).send('OK');

  const webhookSecret = process.env.VTSTACK_WEBHOOK_SECRET;
  const signature = req.headers['x-vtstack-signature'];

  // Only verify if a REAL secret is configured (not the placeholder)
  const isPlaceholder = !webhookSecret || webhookSecret.startsWith('vts_wh_...');
  if (!isPlaceholder && signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
    if (signature !== digest) {
      console.warn('[VTStack Webhook] REJECTED: Invalid signature.');
      return;
    }
  } else if (!isPlaceholder && !signature) {
    console.warn('[VTStack Webhook] REJECTED: Missing signature header.');
    return;
  }

  // ── Parse payload matching VTStack format exactly ──
  const { event, data } = req.body || {};

  console.log(`\n[VTStack Webhook] ───────────────────────────────`);
  console.log(`  Event     : ${event}`);
  console.log(`  Account   : ${data?.accountNumber}`);
  console.log(`  Amount    : ₦${data?.amount}`);
  console.log(`  Reference : ${data?.reference}`);
  console.log(`  Status    : ${data?.status}`);
  console.log(`──────────────────────────────────────────────────`);

  if (event !== 'transaction.deposit') {
    console.log(`[VTStack Webhook] Skipping event: ${event}`);
    return;
  }

  const { accountNumber, amount, reference, status } = data || {};

  if (status !== 'success') {
    console.warn(`[VTStack Webhook] Ignoring non-success status: ${status}`);
    return;
  }

  try {
    // ── Idempotency: skip if already processed ──
    const existing = await Deposit.findOne({ reference });
    if (existing) {
      console.warn(`[VTStack Webhook] DUPLICATE: Reference ${reference} already processed.`);
      return;
    }

    // ── Find user by virtual account number ──
    const user = await User.findOne({ 'virtualAccount.number': accountNumber });

    if (!user) {
      console.error(`[VTStack Webhook] FAILED: No user found for account ${accountNumber}`);
      return;
    }

    // ── Credit user wallet ──
    user.balance += amount;
    user.withdrawBalance += amount;

    // Add to earnings history for visibility on the dashboard
    user.earningsHistory = [{
      id: Date.now().toString(),
      type: 'Fund Deposit',
      plan: 'Bank Transfer',
      amount,
      date: new Date().toLocaleDateString(),
      status: 'Completed'
    }, ...(user.earningsHistory || [])];

    await user.save();

    // ── Record deposit ──
    await Deposit.create({
      user: user._id,
      amount,
      reference,
      status: 'Completed',
      channel: 'VTStack'
    });

    console.log(`[VTStack Webhook] ✅ SUCCESS: Credited ₦${amount} to ${user.phone} (ref: ${reference})`);

  } catch (err) {
    console.error(`[VTStack Webhook] ❌ CRITICAL ERROR: ${err.message}`);
  }
};
