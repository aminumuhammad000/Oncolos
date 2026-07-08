const User = require('../models/User');

/**
 * Ensures a default admin exists on server startup
 */
exports.ensureAdminExists = async () => {
    try {
        const email = 'admin@oncolos.com';
        const password = 'Admin@123456';
        
        let existingAdmin = await User.findOne({ email });
        
        if (!existingAdmin) {
            await User.create({
                name: 'Super Admin',
                email,
                password,
                phone: '08000000000',
                role: 'admin',
                referralCode: 'ADMIN_ONC',
                status: 'Active'
            });
            console.log(`[INIT] Admin account created: ${email}`);
        } else {
            existingAdmin.password = password;
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log(`[INIT] Admin account ${email} updated with new password.`);
        }
    } catch (err) {
        console.error('[INIT] Failed to ensure admin exists:', err.message);
    }
};

/**
 * Ensures default investment plans exist
 */
exports.ensureDefaultPlans = async () => {
    try {
        const Plan = require('../models/Plan');
        const count = await Plan.countDocuments();
        if (count === 0) {
            const defaultPlans = [
                { price: 6000, daily: 1000 },
                { price: 12000, daily: 2000 },
                { price: 24000, daily: 4000 },
                { price: 45000, daily: 8000 },
                { price: 90000, daily: 15000 },
                { price: 150000, daily: 25000 },
                { price: 246000, daily: 41000 },
                { price: 300000, daily: 50000 }
            ];
            await Plan.insertMany(defaultPlans);
            console.log(`[INIT] Seeded ${defaultPlans.length} default investment plans.`);
        }
    } catch (err) {
        console.error('[INIT] Failed to seed default plans:', err.message);
    }
};
