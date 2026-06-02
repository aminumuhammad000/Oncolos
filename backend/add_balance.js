const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/oncolos');
  const user = await User.findOneAndUpdate(
    { email: 'aminumuhammad00015@gmail.com' },
    { $inc: { balance: 3000 }, $set: { hasDeposited: true } },
    { new: true }
  );
  if (user) {
    console.log(`✅ Added ₦3,000 to ${user.email}. New balance: ₦${user.balance}`);
  } else {
    console.log('❌ User not found with that email.');
  }
  process.exit();
};

run();
