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
  updateUserBalance,
  updateUserStatus,
  deleteUser
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/settings/public', getSettings);

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
router.get('/deposits', getAllDeposits);
router.post('/users/:id/kyc', updateUserKYC);
router.post('/users/:id/balance', updateUserBalance);
router.post('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
