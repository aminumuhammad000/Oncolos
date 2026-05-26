const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    
    console.log('Recent Users:');
    users.forEach(u => {
      console.log(`- Phone: ${u.phone}, Balance: ₦${u.balance}, Virtual Acc: ${u.virtualAccount?.number || 'NONE'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
