const express = require('express');
const router = express.Router();
const {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deactivateStaff
} = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// Staff management routes
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deactivateStaff);

module.exports = router;