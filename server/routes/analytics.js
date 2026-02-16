const express = require('express');
const router = express.Router();
const {
    getDashboardAnalytics,
    getPredictiveAnalytics,
    exportAnalytics
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// All analytics routes require admin authentication
router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardAnalytics);
router.get('/predictive', getPredictiveAnalytics);
router.get('/export', exportAnalytics);

module.exports = router;