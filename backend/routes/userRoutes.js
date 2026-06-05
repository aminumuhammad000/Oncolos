const express = require('express');
const { claimDailyBonus, generateVirtualAccount, getBankList, verifyBankAccount, updatePassword, saveBankAccount, removeBankAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/daily-bonus', protect, claimDailyBonus);
router.post('/generate-virtual-account', protect, generateVirtualAccount);
router.get('/banks', protect, getBankList);
router.post('/verify-account', protect, verifyBankAccount);
router.post('/update-password', protect, updatePassword);
router.post('/redeem-code', protect, require('../controllers/userController').redeemCode);
router.post('/read-messages', protect, require('../controllers/userController').readMessages);
router.post('/request-withdrawal', protect, require('../controllers/userController').requestWithdrawal);
router.post('/save-bank', protect, saveBankAccount);
router.delete('/remove-bank/:index', protect, removeBankAccount);

module.exports = router;
