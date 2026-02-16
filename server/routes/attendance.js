const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getAttendance,
    getAttendanceById,
    updateAttendance,
    getAttendanceStats
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Attendance routes
router.get('/stats/overview', getAttendanceStats);
router.get('/', getAttendance);
router.get('/:id', getAttendanceById);
router.post('/', markAttendance);
router.put('/:id', updateAttendance);

module.exports = router;