const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile,
    updateProfilePhoto,
    deleteProfilePhoto,
    forgotPassword,
    changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer for profile photo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + req.user.id + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

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
router.post('/forgot-password', forgotPassword);

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/profile/photo', authenticate, upload.single('photo'), updateProfilePhoto);
router.delete('/profile/photo', authenticate, deleteProfilePhoto);

module.exports = router;