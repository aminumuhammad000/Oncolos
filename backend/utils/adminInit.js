const User = require('../models/User');
const { buildDefaultPlans } = require('./planUtils');

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
            const defaultPlans = buildDefaultPlans();
            await Plan.insertMany(defaultPlans);
            console.log(`[INIT] Seeded ${defaultPlans.length} default investment plans.`);
        }
    } catch (err) {
        console.error('[INIT] Failed to seed default plans:', err.message);
    }
};
