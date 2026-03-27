// routes/dailyReport.js - CORRECTED VERSION
const express = require('express');
const router = express.Router();
const {
    createDailyReport,
    getAllDailyReports,
    getDailyReportById,
    updateDailyReport,
    deleteDailyReport,
    getReportsByResident,
    getReportsNeedingAttention,
    markAsResolved,
    getReportStats,
    getMonthlySummary
} = require('../controllers/dailyReportController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Public routes (for authenticated users)
router.get('/', getAllDailyReports);  // LINE 21 - This was causing the error
router.get('/stats/overview', getReportStats);
router.get('/resident/:type/:residentId', getReportsByResident);
router.get('/:id', getDailyReportById);
router.post('/', createDailyReport);
router.put('/:id', updateDailyReport);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteDailyReport);
router.get('/attention/needed', authorize('admin'), getReportsNeedingAttention);
router.put('/:id/resolve', authorize('admin'), markAsResolved);
router.get('/summary/monthly', authorize('admin'), getMonthlySummary);

module.exports = router;