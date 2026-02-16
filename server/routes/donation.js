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

// All routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// Statistics route
router.get('/stats/overview', getDonationStats);
router.get('/receipts/recent', getRecentReceipts);

// CRUD operations
router.get('/', getAllDonations);
router.get('/:id', getDonationById);
router.post('/', createDonation);
router.put('/:id', updateDonation);
router.delete('/:id', deleteDonation);

// Action routes
router.put('/:id/verify', verifyDonation);
router.post('/:id/generate-receipt', generateReceipt);
router.post('/:id/send-thankyou', sendThankYou);

module.exports = router;