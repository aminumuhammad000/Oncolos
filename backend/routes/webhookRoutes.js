const express = require('express');
const { handleDeposit } = require('../controllers/webhookController');
const router = express.Router();

router.post('/vtstack', handleDeposit);

module.exports = router;
