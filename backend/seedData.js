const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Investment = require('./models/Investment');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/oncolos';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Investment.deleteMany({});
        console.log('Existing data cleared.');

        // Create Demo Users
        const users = [
            {
                name: 'Hassan Ibrahim',
                phone: '08012345678',
                email: 'hassan@example.com',
                password: 'password123',
                referralCode: 'ONC1001',
                balance: 45000,
                withdrawBalance: 5000,
                virtualAccount: { number: '8102345678', bank: 'PalmPay', name: 'ONC-HASSAN IBRAHIM' },
                bvn: '22112233445',
                kycStatus: 'verified'
            },
            {
                name: 'Bola Ade',
                phone: '09032221111',
                email: 'bola@example.com',
                password: 'password123',
                referralCode: 'ONC1002',
                referredBy: 'ONC1001',
                balance: 45000,
                withdrawBalance: 12000,
                virtualAccount: { number: '8103222111', bank: 'PalmPay', name: 'ONC-BOLA ADE' },
                bvn: '22998877665',
                kycStatus: 'verified'
            },
            {
                name: 'Chisom Obi',
                phone: '08118889900',
                email: 'chisom@example.com',
                password: 'password123',
                referralCode: 'ONC1003',
                referredBy: 'ONC1002',
                balance: 0,
                withdrawBalance: 0,
                virtualAccount: { number: '8101888990', bank: 'PalmPay', name: 'ONC-CHISOM OBI' },
                bvn: '22887766554',
                kycStatus: 'pending'
            },
            {
                name: 'Super Admin',
                phone: '0000000000',
                email: 'admin@oncolos.com.ng',
                password: 'adminpassword',
                referralCode: 'ADMIN01',
                role: 'admin',
                balance: 0,
                kycStatus: 'verified'
            }
        ];

        const createdUsers = await User.create(users);
        console.log(`${createdUsers.length} users created.`);

        // Create Demo Investments
        const investments = [
            {
                user: createdUsers[0]._id,
                planPrice: 6000,
                dailyIncome: 1000,
                status: 'Running',
                daysElapsed: 5,
                earned: 5000
            },
            {
                user: createdUsers[1]._id,
                planPrice: 45000,
                dailyIncome: 8000,
                status: 'Running',
                daysElapsed: 2,
                earned: 16000
            }
        ];

        const createdInvestments = await Investment.create(investments);
        
        // Link investments back to users for the 'Stock' page display
        for (const inv of createdInvestments) {
          await User.findByIdAndUpdate(inv.user, {
            $push: { activeInvestments: inv }
          });
        }
        
        console.log('Demo investments created and linked to users.');

        console.log('Seeding complete! Closing connection...');
        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
};

seedData();
