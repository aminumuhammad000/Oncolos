/**
 * Run this script on your production server to promote a user to admin
 * Usage: node scripts/makeAdmin.js <phone_or_email>
 * 
 * Example: node scripts/makeAdmin.js 08100015490
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const identifier = process.argv[2];

if (!identifier) {
    console.error('Usage: node scripts/makeAdmin.js <phone_or_email>');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });

    if (!user) {
        console.error(`❌ No user found with phone/email: ${identifier}`);
        process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅ User promoted to admin:`);
    console.log(`   Name:  ${user.name}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role:  ${user.role}`);

    mongoose.disconnect();
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
