const express = require('express');
const { handleDeposit, handlePaystackWebhook } = require('../controllers/webhookController');
const router = express.Router();

router.post('/vtstack', handleDeposit);
router.post('/paystack', handlePaystackWebhook);

module.exports = router;
