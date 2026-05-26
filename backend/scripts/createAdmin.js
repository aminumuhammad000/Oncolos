/**
 * Run this script to create a specific admin user
 * Usage: node scripts/createAdmin.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const email = 'admin@oncolos.com';
const password = '12345678';
const phone = '08000000000'; // Dummy phone for admin

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Check if admin exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
        console.log(`⚠️ Admin with email ${email} already exists. Updating password...`);
        existingAdmin.password = password;
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Admin credentials updated.');
    } else {
        await User.create({
            name: 'Super Admin',
            email,
            password,
            phone,
            role: 'admin',
            referralCode: 'ADMIN_ONC',
            status: 'Active'
        });
        console.log('✅ Admin user created successfully.');
    }

    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);

    mongoose.disconnect();
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
