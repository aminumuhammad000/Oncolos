/**
 * Manual Deposit Recovery Script
 *
 * Fixes TWO problems found from the VTStack server log:
 *
 * Problem 1: The DB stores virtualAccount.number = "9084124839" for user
 *            aminumuhammad00015@gmail.com, but the REAL PalmPay account
 *            that VTStack assigned is "6675807810". Future deposits will
 *            never match unless we fix this.
 *
 * Problem 2: A ₦10,000 deposit (orderNo: MI2059212199200739328) was rejected
 *            by VTStack internally due to timestamp age, so our server never
 *            received it. We credit it manually here.
 *
 * Run from:  /home/amee/Desktop/ONCOLOS/backend
 * Command:   node recover_deposit.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Deposit = require('./models/Deposit');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/oncolos';

// ── Known correct values from VTStack log ──
const USER_EMAIL          = 'aminumuhammad00015@gmail.com'; // confirmed from DB
const CORRECT_VA_NUMBER   = '6675807810';                   // real PalmPay account
const AMOUNT_NAIRA        = 10000;
const REFERENCE           = 'RECOVER_MI2059212199200739328';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // ── Find user by email ──
  const user = await User.findOne({ email: USER_EMAIL });
  if (!user) {
    console.error(`❌ User not found: ${USER_EMAIL}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`User         : ${user.name} | ${user.phone} | ${user.email}`);
  console.log(`DB VA number : ${user.virtualAccount?.number}  (stored)`);
  console.log(`Real VA num  : ${CORRECT_VA_NUMBER}             (from VTStack log)`);
  console.log(`Balance now  : ₦${user.balance}`);
  console.log(`Withdraw now : ₦${user.withdrawBalance}\n`);

  // ── FIX 1: Correct the stored virtual account number ──
  if (user.virtualAccount?.number !== CORRECT_VA_NUMBER) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          'virtualAccount.number': CORRECT_VA_NUMBER,
          'virtualAccount.name':   'AMINUMUHAMMAD00015 ONCOLOS',
          'virtualAccount.bank':   'PalmPay'
        }
      }
    );
    console.log(`✅ FIX 1: virtualAccount.number updated → ${CORRECT_VA_NUMBER}`);
  } else {
    console.log('ℹ️  FIX 1: virtualAccount.number already correct — skipping.');
  }

  // ── FIX 2: Credit the missed ₦10,000 deposit (idempotent) ──
  const existing = await Deposit.findOne({ reference: REFERENCE });
  if (existing) {
    console.log('ℹ️  FIX 2: Deposit already recovered — skipping credit.');
  } else {
    await User.updateOne(
      { _id: user._id },
      { $inc: { balance: AMOUNT_NAIRA, withdrawBalance: AMOUNT_NAIRA } }
    );

    await Deposit.create({
      user:      user._id,
      amount:    AMOUNT_NAIRA,
      reference: REFERENCE,
      status:    'Completed',
      channel:   'VTStack (Manual Recovery)'
    });

    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          earningsHistory: {
            $each: [{
              id:     Date.now().toString(),
              type:   'Fund Deposit',
              plan:   'Bank Transfer',
              amount: AMOUNT_NAIRA,
              date:   new Date().toLocaleDateString(),
              status: 'Completed'
            }],
            $position: 0
          }
        }
      }
    );
    console.log(`✅ FIX 2: ₦${AMOUNT_NAIRA} credited to ${user.phone}`);
  }

  const updated = await User.findOne({ email: USER_EMAIL });
  console.log(`\n── Final state ─────────────────────`);
  console.log(`   VA number   : ${updated.virtualAccount?.number}`);
  console.log(`   Balance     : ₦${updated.balance}`);
  console.log(`   Withdrawable: ₦${updated.withdrawBalance}`);
  console.log(`────────────────────────────────────\n`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

