const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/oncolos')
  .then(async () => {
    const admin = await User.findOne({ email: 'admin@oncolos.com' }).select('+password');
    console.log(admin ? `Admin found! Password hash: ${admin.password}` : 'Admin NOT found');
    
    if (admin) {
      const isValid = await admin.comparePassword('Admin@123456', admin.password);
      console.log('Is Admin@123456 valid?', isValid);
      
      if (!isValid) {
        console.log('Let us force update it specifically...');
        admin.password = 'Admin@123456';
        await admin.save();
        console.log('Forced update saved!');
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
