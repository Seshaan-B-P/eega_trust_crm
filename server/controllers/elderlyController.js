const Elderly = require('../models/Elderly');
const User = require('../models/User'); // Your existing User model
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all elderly people
// @route   GET /api/elderly
// @access  Private (Admin & Staff)
const getElderly = async (req, res) => {
    try {
        const { status, search, gender, minAge, maxAge, page = 1, limit = 10 } = req.query;
        let query = {};

        // Status Filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Gender Filter
        if (gender && gender !== 'all') {
            query.gender = gender;
        }

        // Age Filter
        if (minAge || maxAge) {
            query.age = {};
            if (minAge) query.age.$gte = parseInt(minAge);
            if (maxAge) query.age.$lte = parseInt(maxAge);
        }

        // Search Filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { specialNeeds: { $regex: search, $options: 'i' } },
                { medicalHistory: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const elderly = await Elderly.find(query)
            .populate('assignedStaff', 'name email')
            .sort({ dateOfAdmission: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Elderly.countDocuments(query);

        // Statistics (Global stats, not filtered)
        // Note: If staff, stats should probably reflect their view or global? 
        // Typically stats are global or scoped to permission. Let's scope to permission if staff.
        // Note: Removing strict assignedStaff filter for stats to match the list view
        const statsQuery = {};

        const stats = {
            total: await Elderly.countDocuments(statsQuery),
            active: await Elderly.countDocuments({ ...statsQuery, status: 'Active' }),
            hospitalized: await Elderly.countDocuments({ ...statsQuery, status: 'Hospitalized' }),
            deceased: await Elderly.countDocuments({ ...statsQuery, status: 'Deceased' }),
            gender: {
                male: await Elderly.countDocuments({ ...statsQuery, gender: 'Male' }),
                female: await Elderly.countDocuments({ ...statsQuery, gender: 'Female' })
            }
        };

        res.json({
            success: true,
            count: elderly.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            stats,
            elderly: elderly
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single elderly person
// @route   GET /api/elderly/:id
// @access  Private
const getElderlyById = async (req, res) => {
    try {
        const elderly = await Elderly.findById(req.params.id)
            .populate('assignedStaff', 'name email')
            .populate('dailyActivityLog.recordedBy', 'name');

        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Elderly person not found'
            });
        }

        // Check if staff has access
        // Note: Relaxed restrictive assignedStaff check for staff users
        /*
        if (req.user.role === 'staff' &&
            elderly.assignedStaff?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        */

        res.json({
            success: true,
            data: elderly
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new elderly record
// @route   POST /api/elderly
// @access  Private (Admin only)
const createElderly = async (req, res) => {
    try {
        const elderly = await Elderly.create(req.body);

        // Notify admins if created by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'New Elderly Resident Added',
                message: `Staff ${req.user.name} added a new elderly resident: ${elderly.name}`,
                type: 'elderly',
                data: { elderlyId: elderly._id },
                createdBy: req.user.id
            });
        }

        res.status(201).json({
            success: true,
            data: elderly
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update elderly record
// @route   PUT /api/elderly/:id
// @access  Private (Admin & Assigned Staff)
const updateElderly = async (req, res) => {
    try {
        let elderly = await Elderly.findById(req.params.id);

        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Elderly person not found'
            });
        }

        // Check if staff has access
        // Note: Relaxed restrictive assignedStaff check for staff users to allow updates
        /*
        if (req.user.role === 'staff' &&
            elderly.assignedStaff?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        */

        elderly = await Elderly.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Notify admins if updated by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Elderly Resident Updated',
                message: `Staff ${req.user.name} updated elderly resident: ${elderly.name}`,
                type: 'elderly',
                data: { elderlyId: elderly._id },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            data: elderly
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete elderly record
// @route   DELETE /api/elderly/:id
// @access  Private (Admin only)
const deleteElderly = async (req, res) => {
    try {
        const elderly = await Elderly.findById(req.params.id);

        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Elderly person not found'
            });
        }

        await elderly.deleteOne();

        // Notify admins if deleted by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Elderly Resident Deleted',
                message: `Staff ${req.user.name} deleted elderly record: ${elderly.name}`,
                type: 'elderly',
                data: { elderlyId: elderly._id },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add daily activity log
// @route   POST /api/elderly/:id/activities
// @access  Private (Assigned Staff)
const addActivityLog = async (req, res) => {
    try {
        const elderly = await Elderly.findById(req.params.id);

        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Elderly person not found'
            });
        }

        // Check if staff has access
        // Note: Relaxed restrictive assignedStaff check for staff users to allow activity logs
        /*
        if (elderly.assignedStaff?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not assigned to this elderly person'
            });
        }
        */

        const activity = {
            ...req.body,
            recordedBy: req.user.id
        };

        elderly.dailyActivityLog.push(activity);
        await elderly.save();

        // Notify admins if added by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'New Activity Log Added',
                message: `Staff ${req.user.name} added an activity log for ${elderly.name}: ${activity.activity}`,
                type: 'elderly',
                data: { elderlyId: elderly._id, activityType: activity.activity },
                createdBy: req.user.id
            });
        }

        res.status(201).json({
            success: true,
            data: activity
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get elderly statistics for dashboard
// @route   GET /api/elderly/stats/summary
// @access  Private (Admin only)
const getElderlyStats = async (req, res) => {
    try {
        const total = await Elderly.countDocuments({ status: 'Active' });
        const bySpecialNeeds = await Elderly.aggregate([
            { $match: { status: 'Active' } },
            { $group: { _id: '$specialNeeds', count: { $sum: 1 } } }
        ]);
        const ageGroups = await Elderly.aggregate([
            { $match: { status: 'Active' } },
            {
                $bucket: {
                    groupBy: '$age',
                    boundaries: [60, 70, 80, 90, 100],
                    default: '100+',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        const deceased = await Elderly.countDocuments({ status: 'Deceased' });
        const hospitalized = await Elderly.countDocuments({ status: 'Hospitalized' });

        res.json({
            success: true,
            stats: {
                total,
                active: total, // Assuming Active matches total provided by current query
                hospitalized,
                deceased,
                bySpecialNeeds,
                ageGroups
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getElderly,
    getElderlyById,
    createElderly,
    updateElderly,
    deleteElderly,
    addActivityLog,
    getElderlyStats
};