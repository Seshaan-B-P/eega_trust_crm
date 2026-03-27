const express = require('express');
const router = express.Router();
const {
    getDashboardAnalytics,
    getPredictiveAnalytics,
    exportAnalytics
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// Analytics routes
router.get('/dashboard', authenticate, authorize('admin', 'staff'), getDashboardAnalytics);
router.get('/predictive', authenticate, authorize('admin'), getPredictiveAnalytics);
router.get('/export', authenticate, authorize('admin'), exportAnalytics);

module.exports = router;