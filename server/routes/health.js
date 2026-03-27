const express = require('express');
const router = express.Router();
const { getHealthDistribution } = require('../controllers/dailyReportController');
const { authenticate } = require('../middleware/auth');

// Protected route
router.get('/stats/distribution', authenticate, getHealthDistribution);

module.exports = router;
