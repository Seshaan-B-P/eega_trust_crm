const express = require('express');
const router = express.Router();
const {
    getAllStaff,
    getAvailableStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffStats
} = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

// Public/Protected route for available staff (needed for dropdowns)
router.get('/available', authenticate, getAvailableStaff);

// Staff stats
router.get('/stats/overview', authenticate, getStaffStats);

// All other routes require admin authentication
router.use(authenticate, authorize('admin'));

// Staff management routes
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;