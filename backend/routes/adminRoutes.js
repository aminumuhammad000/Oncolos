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
  deleteUser,
  getAllDeposits,
  getVIPUsers,
  updateVIPLevel,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  loginAsUser,
  changeUserPassword,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/settings/public', getSettings);
router.get('/promotions/public', getAllPromotions); // public — no auth needed
router.get('/plans/public', getAllPlans); // public — no auth needed

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
router.post('/users/:id/login-as', loginAsUser);
router.post('/users/:id/change-password', changeUserPassword);

// VIP
router.get('/vip', getVIPUsers);
router.post('/users/:id/vip', updateVIPLevel);

// Promotions
router.get('/promotions', getAllPromotions);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

// Plans
router.get('/plans', getAllPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

module.exports = router;
