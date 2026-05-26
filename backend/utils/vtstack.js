const axios = require('axios');
const crypto = require('crypto');

const VTSTACK_BASE_URL = 'https://api.vtstack.com.ng/api';

/**
 * Create a Virtual Account on VTStack
 */
exports.createVirtualAccount = async (userData) => {
  const apiKey = process.env.VTSTACK_API_KEY;
  if (!apiKey) {
    console.warn('VTStack API Key missing, skipping real account creation');
    return null;
  }

  try {
    const response = await axios.post(`${VTSTACK_BASE_URL}/virtual-accounts`, {
    firstName: userData.email ? userData.email.split('@')[0].toUpperCase() : userData.firstName,
    lastName: 'ONCOLOS',
      email: userData.email || `${userData.phone}@oncolos.com`,
      phone: userData.phone,
      bvn: userData.bvn || '22123456789', // Simulated BVN for now
      reference: userData.email ? userData.email.split('@')[0] : `user_${userData._id}`
    }, {
      headers: { 'x-api-key': apiKey }
    });

    return response.data;
  } catch (err) {
    console.error('VTStack Create Account Error:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Verify Bank Account (Name Enquiry)
 */
exports.verifyBankAccount = async (bankCode, accountNumber) => {
  const apiKey = process.env.VTSTACK_API_KEY;
  try {
    const response = await axios.get(`${VTSTACK_BASE_URL}/banks/verify`, {
      params: { bankCode, accountNumber },
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Initiate Payout (Tier 3)
 */
exports.initiatePayout = async (payload) => {
  const payoutKey = process.env.VTSTACK_PAYOUT_KEY;
  const timestamp = Date.now().toString();
  const idempotencyKey = crypto.randomUUID();

  // Create Signature: HMAC-SHA256(key, timestamp + stringified_body)
  const signature = crypto.createHmac('sha256', payoutKey)
    .update(timestamp + JSON.stringify(payload))
    .digest('hex');

  try {
    const response = await axios.post(`${VTSTACK_BASE_URL}/v1/payouts/request`, payload, {
      headers: {
        'Authorization': `Bearer ${payoutKey}`,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'x-idempotency-key': idempotencyKey,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (err) {
    console.error('VTStack Payout Error:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Verify Webhook Signature
 */
exports.verifyWebhookSignature = (body, signature, webhookSecret) => {
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = hmac.update(JSON.stringify(body)).digest('hex');
  return signature === digest;
};
