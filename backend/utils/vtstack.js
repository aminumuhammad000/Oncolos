const axios = require('axios');
const crypto = require('crypto');

const VTSTACK_BASE_URL = 'https://api.vtstack.com.ng';

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
    const response = await axios.post(`${VTSTACK_BASE_URL}/api/virtual-accounts`, {
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
 * Fallback list of top Nigerian banks in case API is down
 */
const FALLBACK_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Access Bank (Diamond)' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '999992', name: 'Opay (Digital Bank)' },
  { code: '999991', name: 'PalmPay' },
  { code: '50606', name: 'Kuda Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '102', name: 'Titans Trust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank For Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '50515', name: 'Moniepoint MFB' },
  { code: '50211', name: 'Kredi Money MFB' },
  { code: '090110', name: 'VFD Bank' },
  { code: '090551', name: 'FairMoney MFB' },
  { code: '090267', name: 'Rubies MFB' },
  { code: '090452', name: 'SmartCash PSB' },
  { code: '090405', name: 'MTN MoMo PSB' },
  { code: '100004', name: 'Opay' }
];

/**
 * Get List of Banks from VTStack
 */
exports.getBanks = async () => {
    const apiKey = process.env.VTSTACK_API_KEY;
    try {
        const response = await axios.get(`${VTSTACK_BASE_URL}/api/banks`, {
            headers: { 'x-api-key': apiKey },
            timeout: 5000 // 5 second timeout
        });
        const raw = response.data.data || [];
        if (raw.length === 0) return FALLBACK_BANKS;
        // Normalize: VTStack may return bankCode or code as the bank identifier
        return raw.map(b => ({
            code: b.bankCode || b.code || b.bank_code,
            name: b.bankName || b.name || b.bank_name
        }));
    } catch (err) {
        console.error('VTStack Get Banks Error (Using fallback):', err.message);
        return FALLBACK_BANKS;
    }
};

/**
 * Verify Bank Account (Name Enquiry)
 */
exports.verifyBankAccount = async (bankCode, accountNumber) => {
  const apiKey = process.env.VTSTACK_API_KEY;
  try {
    console.log(`[VTStack] Verifying: bankCode=${bankCode}, accountNumber=${accountNumber}`);
    const response = await axios.get(`${VTSTACK_BASE_URL}/api/banks/verify`, {
      params: { bankCode, accountNumber },
      headers: { 'x-api-key': apiKey }
    });
    console.log('[VTStack] Verify response:', response.data);
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.status ? `VTStack API Status ${err.response.status}` : err.message;
    console.warn('[VTStack] Verify Account Unavailable:', errorMsg);
    throw err;
  }
};

/**
 * Initiate Payout via VTStack
 *
 * CONFIRMED WORKING (tested 2026-06-06):
 * - Endpoint: POST https://api.vtstack.com.ng/api/payout
 * - Auth:     Authorization: Bearer {VTSTACK_API_KEY}
 * - Amount:   Must be in KOBO (naira × 100). e.g. ₦1,000 = 100000
 * - Min payout: ₦1,000 (100000 kobo)
 * - VTStack deducts a small fee from the kobo amount automatically
 */
exports.initiatePayout = async ({ amount, bankCode, accountNumber, accountName, narration }) => {
  const apiKey = process.env.VTSTACK_API_KEY;
  if (!apiKey) throw new Error('VTSTACK_API_KEY is not configured');

  // Convert naira to kobo
  const amountInKobo = Math.round(amount * 100);

  const payload = {
    amount: amountInKobo,
    bankCode,
    accountNumber,
    accountName,
    narration: narration || 'Oncolous Withdrawal'
  };

  console.log(`[VTStack Payout] Initiating ₦${amount} payout (${amountInKobo} kobo) to ${accountNumber} [${bankCode}]`);

  const response = await axios.post(`${VTSTACK_BASE_URL}/api/payout`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 30000,
    validateStatus: () => true
  });

  console.log(`[VTStack Payout] Response ${response.status}:`, JSON.stringify(response.data, null, 2));

  if (response.status === 200 || response.status === 201) {
    return response.data;
  }

  const errMsg = response.data?.message || `Payout failed with HTTP ${response.status}`;
  const err = new Error(errMsg);
  err.response = { status: response.status, data: response.data };
  throw err;
};

/**
 * Verify Webhook Signature
 */
exports.verifyWebhookSignature = (body, signature, webhookSecret) => {
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = hmac.update(JSON.stringify(body)).digest('hex');
  return signature === digest;
};
