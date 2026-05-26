const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Deposit = require('../models/Deposit');
const User = require('../models/User');

async function checkDeposits() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const recentDeposits = await Deposit.find().sort({ createdAt: -1 }).limit(10).populate('user');
    
    if (recentDeposits.length === 0) {
      console.log('No deposits found in the database.');
    } else {
      console.log('Recent Deposits:');
      recentDeposits.forEach(d => {
        console.log(`- User: ${d.user?.phone || 'Unknown'}, Amount: ₦${d.amount}, Ref: ${d.reference}, Date: ${d.createdAt}, Status: ${d.status}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDeposits();
