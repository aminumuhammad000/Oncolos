const vt = require('./utils/vtstack');
require('dotenv').config();

async function test() {
    console.log('Fetching banks...');
    const banks = await vt.getBanks();
    console.log('Result count:', banks.length);
    if (banks.length > 0) {
        console.log('First 3 banks:', banks.slice(0, 3));
    } else {
        console.log('No banks returned. Check API key and URL.');
    }
}

test();
