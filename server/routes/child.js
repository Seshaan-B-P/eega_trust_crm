const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Child = require('../models/Child');
const Staff = require('../models/Staff');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { autoAssignStaff } = require('../utils/assignmentUtils');
const { createNotification } = require('../utils/notificationHelper');

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
router.post('/:id/photo', authenticate, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Use findOne with a flexible query to handle both mongo _id and childId
        // Also handle potential mongo CastError by checking if Id is valid objectId
        const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
        const query = isObjectId
            ? { $or: [{ _id: req.params.id }, { childId: req.params.id }] }
            : { childId: req.params.id };

        const child = await Child.findOne(query);

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Construct URL
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

// Photo delete endpoint
router.delete('/:id/photo', authenticate, async (req, res) => {
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
        const query = isObjectId
            ? { $or: [{ _id: req.params.id }, { childId: req.params.id }] }
            : { childId: req.params.id };

        const child = await Child.findOne(query);

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        child.photo = null;
        await child.save();

        res.json({
            success: true,
            message: 'Photo removed successfully',
            data: child
        });

    } catch (error) {
        console.error('Photo delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error removing photo'
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
            transferred: await Child.countDocuments({ status: 'transferred' }),
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

        // Fetch recent children for dashboard
        const children = await Child.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name age gender childId photo status');

        res.json({
            success: true,
            stats,
            children
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
        
        // Status filter (default to active if not specified, unless 'all' is requested)
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
            .populate('assignedStaff', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Child.countDocuments(query);

        // Statistics
        const stats = {
            total: await Child.countDocuments(),
            active: await Child.countDocuments({ status: 'active' }),
            discharged: await Child.countDocuments({ status: 'discharged' }),
            transferred: await Child.countDocuments({ status: 'transferred' }),
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
        }).populate('assignedStaff', 'name email');

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

// Create new child (staff & admin)
router.post('/', authenticate, authorize('staff', 'admin'), async (req, res) => {
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
        const newChildData = {
            ...childData,
            childId,
            createdBy: req.user.id
        };

        // Auto-assign staff if not provided
        if (!newChildData.assignedStaff) {
            const assignedStaffId = await autoAssignStaff('caretaker');
            if (assignedStaffId) {
                newChildData.assignedStaff = assignedStaffId;
            }
        }

        const newChild = await Child.create(newChildData);

        // Update staff capacity if assigned
        if (newChild.assignedStaff) {
            await Staff.findOneAndUpdate(
                { user: newChild.assignedStaff },
                { $inc: { assignedChildrenCount: 1 } }
            );
        }

        // Notify admins if created by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'New Child Created',
                message: `Staff ${req.user.name} added a new child: ${newChild.name}`,
                type: 'child',
                data: { childId: newChild._id, internalId: newChild.childId },
                createdBy: req.user.id
            });
        }

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

        // If dateOfBirth is updated, validate it
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            if (isNaN(dob.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date of birth format'
                });
            }
            child.dateOfBirth = dob;
        }

        const oldAssignedStaff = child.assignedStaff ? child.assignedStaff.toString() : null;

        // Apply other updates
        const immutableFields = ['childId', '_id', 'createdAt', 'createdBy'];
        Object.keys(otherUpdates).forEach(key => {
            // Prevent updating immutable fields
            if (!immutableFields.includes(key)) {
                child[key] = otherUpdates[key];
            }
        });

        await child.save();

        const newAssignedStaff = child.assignedStaff ? child.assignedStaff.toString() : null;

        // Handle staff capacity updates if assignment changed
        if (oldAssignedStaff !== newAssignedStaff) {
            // Decrement old staff count
            if (oldAssignedStaff) {
                await Staff.findOneAndUpdate(
                    { user: oldAssignedStaff },
                    { $inc: { assignedChildrenCount: -1 } }
                );
            }
            // Increment new staff count
            if (newAssignedStaff) {
                await Staff.findOneAndUpdate(
                    { user: newAssignedStaff },
                    { $inc: { assignedChildrenCount: 1 } }
                );
            }
        }

        // Notify admins if updated by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Child Record Updated',
                message: `Staff ${req.user.name} updated child record: ${child.name}`,
                type: 'child',
                data: { childId: child._id, internalId: child.childId },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Child updated successfully',
            child
        });

    } catch (error) {
        console.error('Update child error:', error);

        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error updating child',
            error: error.message
        });
    }
});

const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');

// ... existing code ...

// Delete child (staff & admin - hard delete with cascade)
router.delete('/:id', authenticate, authorize('staff', 'admin'), async (req, res) => {
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

        // Delete related data (Cascade Delete)
        await Promise.all([
            DailyReport.deleteMany({ child: child._id }),
            Attendance.deleteMany({ child: child._id })
        ]);

        // Decrement staff capacity if child was assigned
        if (child.assignedStaff) {
            await Staff.findOneAndUpdate(
                { user: child.assignedStaff },
                { $inc: { assignedChildrenCount: -1 } }
            );
        }

        // Hard delete child
        await Child.findByIdAndDelete(child._id);

        // Notify admins if deleted by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Child Record Deleted',
                message: `Staff ${req.user.name} deleted child record: ${child.name}`,
                type: 'child',
                data: { childId: child._id, internalId: child.childId },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Child and all associated data deleted successfully',
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

// Delete ALL children (admin only)
router.delete('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Delete related data first
        await Promise.all([
            DailyReport.deleteMany({}),
            Attendance.deleteMany({})
        ]);

        // Delete all children
        const result = await Child.deleteMany({});

        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} children and all associated data`,
            count: result.deletedCount
        });

    } catch (error) {
        console.error('Delete all children error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting all children'
        });
    }
});

module.exports = router;