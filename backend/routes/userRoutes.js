const express = require('express');
const { claimDailyBonus, generateVirtualAccount, getBankList, verifyBankAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/daily-bonus', protect, claimDailyBonus);
router.post('/generate-virtual-account', protect, generateVirtualAccount);
router.get('/banks', protect, getBankList);
router.post('/verify-account', protect, verifyBankAccount);

module.exports = router;
