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
      reference: `ONC_${userData.phone}_${Date.now().toString().slice(-6)}`
    }, {
      headers: { 'x-api-key': apiKey }
    });

    // VTStack returns success: true for successful creation
    if (response.data.success === true || response.data.status === 'success' || response.data.status === 'active') {
      const acc = response.data.data;
      return {
        status: 'success',
        data: {
          accountNumber: acc.account_number || acc.accountNumber,
          bankName: acc.bank_name || acc.bankName || 'PalmPay', 
          accountName: acc.account_name || acc.accountName
        }
      };
    }
    return response.data;
  } catch (err) {
    const errorData = err.response?.data || { status: 'error', message: err.message };
    if (err.response) errorData.statusCode = err.response.status;
    console.error('VTStack Create Account Error:', errorData);
    
    // Scan errorData recursively for anything that looks like an account object
    const findAcc = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.account_number || obj.accountNumber) return obj;
      for (const k in obj) {
        const found = findAcc(obj[k]);
        if (found) return found;
      }
      return null;
    };

    const existingAcc = findAcc(errorData);
    
    if (existingAcc) {
       console.log('Successfully recovered account from error response:', existingAcc);
       return {
         status: 'success',
         data: {
           accountNumber: existingAcc.account_number || existingAcc.accountNumber,
           bankName: existingAcc.bank_name || existingAcc.bankName || 'VTStack Bank',
           accountName: existingAcc.account_name || existingAcc.accountName
         }
       };
    }
    
    // Final fallback: if the message says "successfully created", try one last time to flag success
    if (errorData.message && errorData.message.toLowerCase().includes('successfully created')) {
        return { status: 'success', data: errorData.data || {} };
    }

    return errorData;
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
