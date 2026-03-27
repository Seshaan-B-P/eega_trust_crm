const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Elderly = require('../models/Elderly');
const {
    getElderly,
    getElderlyById,
    createElderly,
    updateElderly,
    deleteElderly,
    addActivityLog,
    getElderlyStats
} = require('../controllers/elderlyController');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware aliases to match existing code
const protect = authenticate;
const admin = authorize('admin');
const staffOrAdmin = authorize('staff', 'admin');

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'elderly-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
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

// All routes are protected
router.use(protect);

// Statistics route (allow both staff and admin)
router.get('/stats', staffOrAdmin, getElderlyStats);

// Main routes
router.route('/')
    .get(staffOrAdmin, getElderly)
    .post(staffOrAdmin, createElderly);

router.route('/:id')
    .get(staffOrAdmin, getElderlyById)
    .put(staffOrAdmin, updateElderly)
    .delete(staffOrAdmin, deleteElderly);

// Activity log route
router.post('/:id/activities', staffOrAdmin, addActivityLog);

// Photo upload endpoint
router.post('/:id/photo', protect, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Use findById or flexible query based on valid objectId
        const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!isObjectId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid record ID'
            });
        }

        const elderly = await Elderly.findById(req.params.id);

        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Elderly person not found'
            });
        }

        // Construct URL
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        elderly.photo = photoUrl;
        await elderly.save();

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            data: elderly,
            photoUrl: photoUrl
        });

    } catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error uploading photo'
        });
    }
});

// Photo delete endpoint
router.delete('/:id/photo', protect, async (req, res) => {
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!isObjectId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid record ID'
            });
        }

        const elderly = await Elderly.findById(req.params.id);

        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Elderly person not found'
            });
        }

        elderly.photo = null;
        await elderly.save();

        res.json({
            success: true,
            message: 'Photo removed successfully',
            data: elderly
        });

    } catch (error) {
        console.error('Photo delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error removing photo'
        });
    }
});

module.exports = router;