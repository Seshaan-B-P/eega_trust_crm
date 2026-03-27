const express = require('express');
const router = express.Router();
const {
    createDonation,
    getAllDonations,
    getDonationById,
    updateDonation,
    deleteDonation,
    verifyDonation,
    generateReceipt,
    sendThankYou,
    getDonationStats,
    getRecentReceipts
} = require('../controllers/donationController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Statistics route
router.get('/stats', getDonationStats);
router.get('/stats/overview', getDonationStats);
router.get('/receipts/recent', authorize('admin'), getRecentReceipts);

// CRUD operations
router.get('/', getAllDonations);
router.get('/:id', getDonationById);
router.post('/', createDonation); // Both staff and admin can create
router.put('/:id', authorize('admin'), updateDonation);
router.delete('/:id', authorize('admin'), deleteDonation);

// Action routes (Admin only)
router.put('/:id/verify', authorize('admin'), verifyDonation);
router.post('/:id/generate-receipt', authorize('admin'), generateReceipt);
router.post('/:id/send-thankyou', authorize('admin'), sendThankYou);

module.exports = router;