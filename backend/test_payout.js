const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

const VTSTACK_API_KEY = process.env.VTSTACK_API_KEY || ''; 
const payoutKey = 'vt_pout_sec_cc16e6e148bedead567284889211f81eb5265412be05b32b502d53847b5f07e2';
const BASE = 'https://api.vtstack.com.ng';
const agent = new https.Agent({ rejectUnauthorized: false });

// Step 1: Get OPay bank code
async function getOpayCode() {
  try {
    const res = await axios.get(`${BASE}/api/banks`, {
      headers: { 'x-api-key': VTSTACK_API_KEY },
      httpsAgent: agent
    });
    const banks = res.data.data || [];
    const opay = banks.find(b => (b.bankName || b.name || '').toLowerCase().includes('opay'));
    console.log('OPay bank entry:', opay);
    return opay?.bankCode || opay?.code || '999';
  } catch(err) {
    console.log('Could not fetch banks:', err.response?.data || err.message);
    return '999';
  }
}

// Step 2: Try payout with different Authorization schemes
async function tryPayout(label, headers, payload) {
  const timestamp = Date.now().toString();
  const idempotencyKey = crypto.randomUUID();
  const bodyStr = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', payoutKey).update(timestamp + bodyStr).digest('hex');

  try {
    const response = await axios.post(`${BASE}/api/payout/secure/request`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': sig,
        'X-Timestamp': timestamp,
        'X-Idempotency-Key': idempotencyKey,
        ...headers
      },
      timeout: 15000,
      validateStatus: () => true,
      httpsAgent: agent
    });
    console.log(`\n[${label}] ${response.status}:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch(err) {
    console.error(`[${label}] NET ERROR:`, err.code || err.message);
  }
}

async function run() {
  const bankCode = await getOpayCode();
  console.log('\nUsing OPay bank code:', bankCode);

  const payload = {
    amount: 100,
    bankCode,
    accountNumber: '8100015498',
    accountName: 'OPay',
    narration: 'Test Withdrawal'
  };

  console.log('\n--- Testing payout ---');
  // Standard Bearer
  await tryPayout('Bearer auth', { 'Authorization': `Bearer ${payoutKey}` }, payload);

  // Try if maybe needs both standard API key + payout key
  if (VTSTACK_API_KEY) {
    await tryPayout('x-api-key + Bearer', { 'x-api-key': VTSTACK_API_KEY, 'Authorization': `Bearer ${payoutKey}` }, payload);
  }

  // Try Token instead of Bearer prefix  
  await tryPayout('Token prefix', { 'Authorization': `Token ${payoutKey}` }, payload);

  // Try raw key without prefix
  await tryPayout('Raw key', { 'Authorization': payoutKey }, payload);
}

run();
