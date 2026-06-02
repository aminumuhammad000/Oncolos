const User = require('../models/User');
const Deposit = require('../models/Deposit');
const crypto = require('crypto');

exports.handleDeposit = async (req, res) => {
  // ── Always respond 200 immediately so VTStack doesn't retry ──
  res.status(200).send('OK');

  const raw = req.body || {};

  console.log('\n[Webhook] ══════════════════════════════════════════');
  console.log('[Webhook] Full body received:', JSON.stringify(raw, null, 2));
  console.log('[Webhook] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[Webhook] ══════════════════════════════════════════\n');

  // ── Optional signature verification ──
  const webhookSecret = process.env.VTSTACK_WEBHOOK_SECRET;
  const signature = req.headers['x-vtstack-signature'];

  if (webhookSecret && signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(JSON.stringify(raw)).digest('hex');
    if (signature !== digest) {
      console.warn('[Webhook] ⚠️  Signature mismatch — processing anyway. Set correct VTSTACK_WEBHOOK_SECRET to enforce.');
    } else {
      console.log('[Webhook] ✅ Signature verified.');
    }
  } else {
    console.warn('[Webhook] ⚠️  No secret configured — skipping signature check.');
  }

  const { event, data } = raw;

  // ── VTStack sends amount in KOBO ──
  const amountNaira = data?.amount ? (Number(data.amount) / 100) : 0;

  // VTStack may use 'virtualAccount' or 'accountNumber'

  const accountNumber = data?.virtualAccount || data?.accountNumber;

  console.log(`[Webhook] Event     : ${event}`);
  console.log(`[Webhook] Account   : ${accountNumber}`);
  console.log(`[Webhook] Amount    : ₦${amountNaira}`);
  console.log(`[Webhook] Reference : ${data?.reference}`);
  console.log(`[Webhook] Status    : ${data?.status}`);

  if (event !== 'transaction.deposit') {
    console.log(`[Webhook] Skipping non-deposit event: ${event}`);
    return;
  }

  if (!data?.status || data.status !== 'success') {
    console.warn(`[Webhook] Ignoring non-success status: "${data?.status}"`);
    return;
  }

  if (!amountNaira || amountNaira <= 0) {
    console.error(`[Webhook] ❌ Invalid amount: ${data?.amount}`);
    return;
  }

  const { reference } = data;

  if (!accountNumber) {
    console.error('[Webhook] ❌ Missing accountNumber or virtualAccount in payload');
    return;
  }


  try {
    // ── Idempotency: skip if already processed ──
    if (reference) {
      const existing = await Deposit.findOne({ reference });
      if (existing) {
        console.warn(`[Webhook] DUPLICATE: Reference "${reference}" already processed — skipping.`);
        return;
      }
    }

    // ── Find user by virtual account number ──
    const user = await User.findOne({ 'virtualAccount.number': accountNumber });

    if (!user) {
      console.error(`[Webhook] ❌ No user found with virtualAccount.number="${accountNumber}"`);
      return;
    }

    // ── STEP 1: Atomic wallet credit ──
    await User.updateOne(
      { _id: user._id },
      { 
        $inc: { balance: amountNaira, withdrawBalance: amountNaira },
        $set: { hasDeposited: true }
      }
    );
    console.log(`[Webhook] ✅ Wallet credited: ₦${amountNaira} → user ${user.phone}`);

    // ── STEP 2: Record deposit ──
    await Deposit.create({
      user: user._id,
      amount: amountNaira,
      reference: reference || `MANUAL_${Date.now()}`,
      status: 'Completed',
      channel: 'VTStack'
    });
    console.log(`[Webhook] ✅ Deposit record created.`);

    // ── STEP 3: Append to earningsHistory (best-effort) ──
    try {
      const newEntry = {
        id: Date.now().toString(),
        type: 'Fund Deposit',
        plan: 'Bank Transfer',
        amount: amountNaira,
        date: new Date().toLocaleDateString(),
        status: 'Completed'
      };

      await User.updateOne(
        { _id: user._id },
        { $push: { earningsHistory: { $each: [newEntry], $position: 0 } } }
      );
      console.log(`[Webhook] ✅ Earnings history updated.`);
    } catch (histErr) {
      console.warn(`[Webhook] ⚠️  Earnings history update failed (non-critical): ${histErr.message}`);
    }

    console.log(`\n[Webhook] ✅ SUCCESS: ₦${amountNaira} credited to ${user.phone} (ref: ${reference})\n`);

  } catch (err) {
    console.error(`[Webhook] ❌ CRITICAL ERROR: ${err.message}`);
    console.error(err.stack);
  }
};
