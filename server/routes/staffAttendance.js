const express = require('express');
const router = express.Router();
const {
    markStaffBulkAttendance,
    getStaffAttendance,
    getStaffAttendanceStats,
    getTodayStaffSummary,
    updateStaffAttendance,
    getStaffMonthlyReport,
    getStaffAttendanceById,
    verifyStaffAttendance,
    deleteStaffAttendance
} = require('../controllers/staffAttendanceController');
const { authenticate, authorize } = require('../middleware/auth');

// All staff attendance routes are Admin only
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getStaffAttendance);
router.get('/:id', getStaffAttendanceById);
    
router.put('/:id', updateStaffAttendance);
router.put('/:id/verify', verifyStaffAttendance);
router.delete('/:id', deleteStaffAttendance);
router.post('/bulk', markStaffBulkAttendance);
router.get('/stats', getStaffAttendanceStats);
router.get('/today/summary', getTodayStaffSummary);
router.get('/report/monthly', getStaffMonthlyReport);

module.exports = router;
