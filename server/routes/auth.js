const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth route is working',
        endpoints: ['/test', '/login', '/register', '/profile']
    });
});

// Auth routes
router.post('/register', register);
router.post('/login', login);

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;