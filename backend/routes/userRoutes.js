const express = require('express');
const { claimDailyBonus, generateVirtualAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/daily-bonus', protect, claimDailyBonus);
router.post('/generate-virtual-account', protect, generateVirtualAccount);

module.exports = router;
