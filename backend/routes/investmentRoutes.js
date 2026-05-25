const express = require('express');
const { buyInvestment } = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/buy', protect, buyInvestment);

module.exports = router;
