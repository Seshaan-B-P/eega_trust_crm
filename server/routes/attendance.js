const express = require('express');
const router = express.Router();
const {
    markAttendance,
    markBulkAttendance,
    getAttendance,
    getAttendanceById,
    updateAttendance,
    getAttendanceStats,
    getTodaySummary,
    getMonthlyReport
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Attendance routes
router.get('/stats', getAttendanceStats); // Alias for frontend
router.get('/stats/overview', getAttendanceStats);
router.get('/today/summary', getTodaySummary);
router.get('/', getAttendance);
router.get('/report/monthly', getMonthlyReport);
router.get('/:id', getAttendanceById);
router.post('/', markAttendance);
router.post('/bulk', markBulkAttendance);
router.put('/:id', updateAttendance);

module.exports = router;