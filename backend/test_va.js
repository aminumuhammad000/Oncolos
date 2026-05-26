require('dotenv').config();
const { createVirtualAccount } = require('./utils/vtstack');
const { createPaystackVirtualAccount } = require('./utils/paystack');

async function test() {
    const userData = {
        _id: 'test_user_id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@oncolos.com.ng',
        phone: '09046830695'
    };

    console.log('--- Testing VTStack ---');
    try {
        const vt = await createVirtualAccount(userData);
        console.log('VTStack Result:', JSON.stringify(vt, null, 2));
    } catch (e) {
        console.error('VTStack Error:', e.response?.data || e.message);
    }

    console.log('\n--- Testing Paystack ---');
    try {
        const ps = await createPaystackVirtualAccount(userData);
        console.log('Paystack Result:', JSON.stringify(ps, null, 2));
    } catch (e) {
        console.error('Paystack Error:', e.response?.data || e.message);
    }
}

test();
