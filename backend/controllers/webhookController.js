const User = require('../models/User');
const Deposit = require('../models/Deposit');
const crypto = require('crypto');

exports.handleDeposit = async (req, res) => {
  // ── Always respond 200 immediately so VTStack doesn't retry ──
  res.status(200).send('OK');

  const webhookSecret = process.env.VTSTACK_WEBHOOK_SECRET;
  const signature = req.headers['x-vtstack-signature'];

  if (webhookSecret && signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
    if (signature !== digest) {
      console.warn('[VTStack Webhook] ⚠️  Signature mismatch — processing anyway (verification not enforced). Set correct VTSTACK_WEBHOOK_SECRET to enforce.');
    } else {
      console.log('[VTStack Webhook] ✅ Signature verified.');
    }
  } else {
    console.warn('[VTStack Webhook] ⚠️  No secret configured — skipping signature check.');
  }

  const { event, data } = req.body || {};

  // VTStack sends amount in KOBO — convert to naira
  const amountNaira = data?.amount ? data.amount / 100 : 0;

  console.log(`\n[VTStack Webhook] ───────────────────────────────`);
  console.log(`  Event     : ${event}`);
  console.log(`  Account   : ${data?.accountNumber}`);
  console.log(`  Amount    : ₦${amountNaira} (raw: ${data?.amount} kobo)`);
  console.log(`  Reference : ${data?.reference}`);
  console.log(`  Status    : ${data?.status}`);
  console.log(`──────────────────────────────────────────────────`);

  if (event !== 'transaction.deposit') {
    console.log(`[VTStack Webhook] Skipping event: ${event}`);
    return;
  }

  const { accountNumber, reference, status } = data || {};

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

    // ── STEP 1: Atomic wallet credit — guaranteed even if later steps fail ──
    await User.updateOne(
      { _id: user._id },
      { $inc: { balance: amountNaira, withdrawBalance: amountNaira } }
    );
    console.log(`[VTStack Webhook] ✅ Wallet credited: ₦${amountNaira} → ${user.phone}`);

    // ── STEP 2: Record deposit ──
    await Deposit.create({
      user: user._id,
      amount: amountNaira,
      reference,
      status: 'Completed',
      channel: 'VTStack'
    });

    // ── STEP 3: Append to earningsHistory (best-effort, non-blocking) ──
    try {
      const newEntry = {
        id: Date.now().toString(),
        type: 'Fund Deposit',
        plan: 'Bank Transfer',
        amount: amountNaira,
        date: new Date().toLocaleDateString(),
        status: 'Completed'
      };

      // Use $push so Mongoose never touches existing (possibly corrupted) data
      await User.updateOne(
        { _id: user._id },
        { $push: { earningsHistory: { $each: [newEntry], $position: 0 } } }
      );
      console.log(`[VTStack Webhook] ✅ Earnings history updated.`);
    } catch (histErr) {
      // History failure must NEVER block the credit — just log and move on
      console.warn(`[VTStack Webhook] ⚠️  Earnings history update failed (non-critical): ${histErr.message}`);
    }

    console.log(`[VTStack Webhook] ✅ SUCCESS: Credited ₦${amountNaira} to ${user.phone} (ref: ${reference})`);

  } catch (err) {
    console.error(`[VTStack Webhook] ❌ CRITICAL ERROR: ${err.message}`);
  }
};
