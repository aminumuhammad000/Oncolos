const mongoose = require('mongoose');
const User = require('./models/User');

const check = async () => {
  await mongoose.connect('mongodb://localhost:27017/oncolos');
  const user = await User.findOne({ phone: '08012345678' }).select('+password');
  if (user) {
    console.log('User found:', user.phone);
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', isMatch);
  } else {
    console.log('User NOT found');
  }
  process.exit();
};

check();
