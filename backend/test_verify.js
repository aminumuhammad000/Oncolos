const axios = require('axios');
require('dotenv').config();

const VTSTACK_BASE_URL = 'https://api.vtstack.com.ng/api';
const apiKey = process.env.VTSTACK_API_KEY;

async function testVerify() {
    console.log('Testing Verification...');
    try {
        const response = await axios.get(`${VTSTACK_BASE_URL}/banks/verify`, {
            params: { bankCode: '999992', accountNumber: '7063162584' }, // Randomized Opay number format
            headers: { 'x-api-key': apiKey }
        });
        console.log('Response:', response.data);
    } catch (err) {
        console.log('Error status:', err.response?.status);
        console.log('Error data:', err.response?.data);
    }
}

testVerify();
