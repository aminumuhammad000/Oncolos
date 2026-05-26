const User = require('../models/User');

/**
 * Ensures a default admin exists on server startup
 */
exports.ensureAdminExists = async () => {
    try {
        const email = 'admin@oncolos.com';
        const password = '12345678';
        
        const existingAdmin = await User.findOne({ email });
        
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
        } else if (existingAdmin.role !== 'admin') {
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log(`[INIT] Existing user ${email} promoted to admin.`);
        }
    } catch (err) {
        console.error('[INIT] Failed to ensure admin exists:', err.message);
    }
};
