const express = require('express');
const { 
  getDashboardStats, 
  getAllUsers, 
  getAllInvestments, 
  getAllReferrals,
  getSettings,
  updateSetting,
  getAllWithdrawals,
  updateWithdrawalStatus,
  updateUserKYC,
  updateUserBalance
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.use(isAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/investments', getAllInvestments);
router.get('/referrals', getAllReferrals);
router.get('/settings', getSettings);
router.post('/settings', updateSetting);
router.get('/withdrawals', getAllWithdrawals);
router.post('/withdrawals/:id/status', updateWithdrawalStatus);
router.post('/users/:id/kyc', updateUserKYC);
router.post('/users/:id/balance', updateUserBalance);

module.exports = router;
