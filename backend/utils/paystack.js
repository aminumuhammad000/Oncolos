const axios = require('axios');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Get or Create Paystack Customer and assign Dedicated Virtual Account
 */
exports.createPaystackVirtualAccount = async (userData) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error('Paystack Secret Key missing');
    return null;
  }

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Identify/Create Customer
    let customerCode;
    try {
      const customerRes = await axios.get(`${PAYSTACK_BASE_URL}/customer/${userData.email || userData.phone + '@oncolos.com'}`, { headers });
      customerCode = customerRes.data.data.customer_code;
    } catch (e) {
      const createCustomerRes = await axios.post(`${PAYSTACK_BASE_URL}/customer`, {
        email: userData.email || userData.phone + '@oncolos.com',
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone
      }, { headers });
      customerCode = createCustomerRes.data.data.customer_code;
    }

    // 2. Create Dedicated Virtual Account
    let dvaRes;
    try {
        dvaRes = await axios.post(`${PAYSTACK_BASE_URL}/dedicated_account`, {
          customer: customerCode,
          preferred_bank: "wema-bank" 
        }, { headers });
    } catch (e) {
        if (e.response?.data?.message?.includes('already has a dedicated account')) {
            // Fetch existing dedicated account
            const existingDva = await axios.get(`${PAYSTACK_BASE_URL}/dedicated_account?customer=${customerCode}`, { headers });
            if (existingDva.data.status && existingDva.data.data.length > 0) {
                const acc = existingDva.data.data[0];
                return {
                    status: 'success',
                    data: {
                        accountNumber: acc.account_number,
                        bankName: acc.bank.name,
                        accountName: acc.account_name
                    }
                };
            }
        }
        throw e;
    }

    if (dvaRes.data.status) {
        const acc = dvaRes.data.data;
        return {
            status: 'success',
            data: {
                accountNumber: acc.account_number,
                bankName: acc.bank.name,
                accountName: acc.account_name
            }
        };
    }
    
    return null;
  } catch (err) {
    console.error('Paystack DVA Error:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Get List of Banks
 */
exports.getBanks = async () => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    try {
        const response = await axios.get(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
            headers: { Authorization: `Bearer ${secretKey}` }
        });
        return response.data.data;
    } catch (err) {
        console.error('Paystack Get Banks Error:', err.message);
        return [];
    }
};

/**
 * Resolve Bank Account (Name Enquiry)
 */
exports.verifyAccount = async (accountNumber, bankCode) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    try {
        const response = await axios.get(`${PAYSTACK_BASE_URL}/bank/resolve`, {
            params: { account_number: accountNumber, bank_code: bankCode },
            headers: { Authorization: `Bearer ${secretKey}` }
        });
        return response.data;
    } catch (err) {
        console.error('Paystack Verify Account Error:', err.response?.data || err.message);
        throw err;
    }
};
