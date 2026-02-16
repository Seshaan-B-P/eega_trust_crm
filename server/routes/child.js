const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, 'child-' + Date.now() + path.extname(file.originalname))
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

// Photo upload endpoint
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const child = await Child.findOne({
            $or: [{ _id: req.params.id }, { childId: req.params.id }]
        });

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Construct URL (assuming server runs on same host)
        // In production, use environment variable for base URL
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        child.photo = photoUrl;
        await child.save();

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            data: child,
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

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Children route is working',
        endpoints: ['/test', '/', '/:id', 'POST /', 'PUT /:id', 'DELETE /:id']
    });
});

// Get child statistics
router.get('/stats/overview', authenticate, async (req, res) => {
    try {
        const stats = {
            total: await Child.countDocuments(),
            active: await Child.countDocuments({ status: 'active' }),
            discharged: await Child.countDocuments({ status: 'discharged' }),
            gender: {
                male: await Child.countDocuments({ gender: 'male' }),
                female: await Child.countDocuments({ gender: 'female' })
            },
            ageGroups: {
                '0-5': await Child.countDocuments({ age: { $gte: 0, $lte: 5 } }),
                '6-10': await Child.countDocuments({ age: { $gte: 6, $lte: 10 } }),
                '11-15': await Child.countDocuments({ age: { $gte: 11, $lte: 15 } }),
                '16-18': await Child.countDocuments({ age: { $gte: 16, $lte: 18 } })
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting statistics'
        });
    }
});

// Get all children
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;

        const query = {};

        // Filter by status (default to active if not specified, unless 'all' is requested)
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { childId: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const children = await Child.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Child.countDocuments(query);

        // Statistics
        const stats = {
            total: await Child.countDocuments(),
            active: await Child.countDocuments({ status: 'active' }),
            discharged: await Child.countDocuments({ status: 'discharged' }),
            male: await Child.countDocuments({ gender: 'male' }),
            female: await Child.countDocuments({ gender: 'female' })
        };

        res.json({
            success: true,
            count: children.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            stats,
            children
        });

    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get child by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const child = await Child.findOne({
            $or: [{ _id: req.params.id }, { childId: req.params.id }]
        });

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        res.json({
            success: true,
            child
        });

    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }
        console.error('Get child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create new child (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const childData = req.body;

        // Validation handled by Mongoose schema but good to check specifics
        if (!childData.name || !childData.dateOfBirth || !childData.gender) {
            return res.status(400).json({
                success: false,
                message: 'Name, date of birth, and gender are required'
            });
        }

        // Generate child ID
        const childId = await Child.getNextChildId();

        // Create new child
        const newChild = await Child.create({
            ...childData,
            childId,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Child created successfully',
            child: newChild
        });

    } catch (error) {
        console.error('Create child error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating child',
            stack: error.stack,
            errorObj: error
        });
    }
});

// Update child (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        let child = await Child.findOne({
            $or: [{ _id: req.params.id }, { childId: req.params.id }]
        });

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Update fields
        const { dateOfBirth, ...otherUpdates } = req.body;

        // If dateOfBirth is updated, the pre-save hook will handle age calculation
        // But we need to set it explicitly if it's in the body
        if (dateOfBirth) {
            child.dateOfBirth = dateOfBirth;
        }

        // Apply other updates
        Object.keys(otherUpdates).forEach(key => {
            // Prevent updating immutable fields if necessary
            if (key !== 'childId' && key !== '_id' && key !== 'createdAt') {
                child[key] = otherUpdates[key];
            }
        });

        await child.save();

        res.json({
            success: true,
            message: 'Child updated successfully',
            child
        });

    } catch (error) {
        console.error('Update child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating child'
        });
    }
});

// Delete child (admin only - soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const child = await Child.findOne({
            $or: [{ _id: req.params.id }, { childId: req.params.id }]
        });

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Soft delete - change status to discharged
        child.status = 'discharged';
        child.dischargeDate = new Date();
        await child.save();

        res.json({
            success: true,
            message: 'Child discharged successfully',
            child
        });

    } catch (error) {
        console.error('Delete child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting child'
        });
    }
});

module.exports = router;