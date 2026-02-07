const DailyReport = require('../models/DailyReport');
const Child = require('../models/Child');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create new daily report
// @route   POST /api/reports
// @access  Private (Staff & Admin)
exports.createDailyReport = async (req, res) => {
    try {
        const { child, date, ...reportData } = req.body;
        
        // Validate child exists and is active
        const childDoc = await Child.findOne({ 
            _id: child, 
            status: 'active' 
        });
        
        if (!childDoc) {
            return res.status(404).json({
                success: false,
                message: 'Child not found or not active'
            });
        }
        
        // Check if user is assigned to this child or is admin
        if (req.user.role !== 'admin') {
            const isAssigned = childDoc.assignedStaff?.toString() === req.user.id;
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to report for this child'
                });
            }
        }
        
        // Parse date and set to start of day for comparison
        const reportDate = new Date(date);
        const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));
        
        // Check if report already exists for this child today
        const existingReport = await DailyReport.findOne({
            child,
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        
        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'Daily report already exists for this child today'
            });
        }
        
        // Prepare report data
        const report = {
            ...reportData,
            child,
            staff: req.user.id,
            date: startOfDay
        };
        
        // Check if needs attention
        if (
            report.healthStatus?.overall === 'poor' || 
            report.behavior === 'needs_attention' ||
            (reportData.specialNotes && reportData.specialNotes.toLowerCase().includes('urgent'))
        ) {
            report.needsAttention = true;
        }
        
        // Create report
        const newReport = await DailyReport.create(report);
        
        // Populate response
        const populatedReport = await DailyReport.findById(newReport._id)
            .populate('child', 'name childId age gender')
            .populate('staff', 'name email');
        
        res.status(201).json({
            success: true,
            message: 'Daily report created successfully',
            data: populatedReport
        });
        
    } catch (error) {
        console.error('Error creating daily report:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all daily reports with filters
// @route   GET /api/reports
// @access  Private
exports.getAllDailyReports = async (req, res) => {
    try {
        const {
            child,
            staff,
            startDate,
            endDate,
            needsAttention,
            healthStatus,
            behavior,
            page = 1,
            limit = 20,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;
        
        // Build query
        let query = {};
        
        // Child filter
        if (child && mongoose.Types.ObjectId.isValid(child)) {
            query.child = child;
        }
        
        // Staff filter
        if (staff && mongoose.Types.ObjectId.isValid(staff)) {
            query.staff = staff;
        }
        
        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        
        // Needs attention filter
        if (needsAttention !== undefined) {
            query.needsAttention = needsAttention === 'true';
        }
        
        // Health status filter
        if (healthStatus) {
            query['healthStatus.overall'] = healthStatus;
        }
        
        // Behavior filter
        if (behavior) {
            query.behavior = behavior;
        }
        
        // Staff can only see reports for their assigned children
        if (req.user.role === 'staff') {
            const assignedChildren = await Child.find({ 
                assignedStaff: req.user.id,
                status: 'active'
            }).select('_id');
            
            const childIds = assignedChildren.map(child => child._id);
            query.child = { $in: childIds };
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        // Execute query
        const reports = await DailyReport.find(query)
            .populate('child', 'name childId age gender photo')
            .populate('staff', 'name email profileImage')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();
        
        const total = await DailyReport.countDocuments(query);
        
        // Get statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayReports = await DailyReport.countDocuments({ 
            date: { $gte: today },
            ...query
        });
        
        const attentionNeeded = await DailyReport.countDocuments({ 
            needsAttention: true,
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        // Health status distribution
        const healthStats = await DailyReport.aggregate([
            { $match: query },
            { $group: { 
                _id: '$healthStatus.overall', 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } }
        ]);
        
        res.status(200).json({
            success: true,
            count: reports.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            stats: {
                todayReports,
                attentionNeeded,
                healthStats
            },
            data: reports
        });
        
    } catch (error) {
        console.error('Error fetching daily reports:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get daily report by ID
// @route   GET /api/reports/:id
// @access  Private
exports.getDailyReportById = async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id)
            .populate('child', 'name childId age gender photo bloodGroup medicalHistory allergies')
            .populate('staff', 'name email phone profileImage')
            .lean();
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Daily report not found'
            });
        }
        
        // Check authorization
        if (req.user.role === 'staff') {
            const child = await Child.findById(report.child._id);
            if (child.assignedStaff?.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this report'
                });
            }
        }
        
        // Get previous reports for comparison
        const previousReports = await DailyReport.find({
            child: report.child._id,
            date: { $lt: report.date }
        })
        .sort({ date: -1 })
        .limit(5)
        .select('date healthStatus behavior specialNotes')
        .lean();
        
        res.status(200).json({
            success: true,
            data: {
                ...report,
                previousReports
            }
        });
        
    } catch (error) {
        console.error('Error fetching daily report:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update daily report
// @route   PUT /api/reports/:id
// @access  Private
exports.updateDailyReport = async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Daily report not found'
            });
        }
        
        // Check authorization
        if (req.user.role === 'staff') {
            // Staff can only update their own reports
            if (report.staff.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this report'
                });
            }
            
            // Staff can't change child or date
            if (req.body.child || req.body.date) {
                return res.status(403).json({
                    success: false,
                    message: 'Staff cannot change child or date of report'
                });
            }
        }
        
        // Update report
        const updateData = { ...req.body };
        
        // Check if needs attention
        if (
            updateData.healthStatus?.overall === 'poor' || 
            updateData.behavior === 'needs_attention' ||
            (updateData.specialNotes && updateData.specialNotes.toLowerCase().includes('urgent'))
        ) {
            updateData.needsAttention = true;
        } else if (updateData.healthStatus?.overall !== 'poor' && 
                   updateData.behavior !== 'needs_attention') {
            updateData.needsAttention = false;
        }
        
        const updatedReport = await DailyReport.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('child', 'name childId')
        .populate('staff', 'name email');
        
        res.status(200).json({
            success: true,
            message: 'Daily report updated successfully',
            data: updatedReport
        });
        
    } catch (error) {
        console.error('Error updating daily report:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete daily report
// @route   DELETE /api/reports/:id
// @access  Private/Admin
exports.deleteDailyReport = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can delete reports'
            });
        }
        
        const report = await DailyReport.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Daily report not found'
            });
        }
        
        await report.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Daily report deleted successfully',
            data: {
                id: report._id,
                child: report.child,
                date: report.date
            }
        });
        
    } catch (error) {
        console.error('Error deleting daily report:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get reports by child ID
// @route   GET /api/reports/child/:childId
// @access  Private
exports.getReportsByChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { startDate, endDate, limit = 30 } = req.query;
        
        // Build query
        let query = { child: childId };
        
        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        // Check authorization for staff
        if (req.user.role === 'staff') {
            const child = await Child.findById(childId);
            if (child.assignedStaff?.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view reports for this child'
                });
            }
        }
        
        const reports = await DailyReport.find(query)
            .populate('staff', 'name')
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .lean();
        
        // Calculate statistics
        const healthStats = reports.reduce((stats, report) => {
            const status = report.healthStatus?.overall || 'unknown';
            stats[status] = (stats[status] || 0) + 1;
            return stats;
        }, {});
        
        const behaviorStats = reports.reduce((stats, report) => {
            const behavior = report.behavior || 'unknown';
            stats[behavior] = (stats[behavior] || 0) + 1;
            return stats;
        }, {});
        
        res.status(200).json({
            success: true,
            count: reports.length,
            stats: {
                health: healthStats,
                behavior: behaviorStats,
                needsAttention: reports.filter(r => r.needsAttention).length
            },
            data: reports
        });
        
    } catch (error) {
        console.error('Error fetching child reports:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid child ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get reports needing attention
// @route   GET /api/reports/attention/needed
// @access  Private/Admin
exports.getReportsNeedingAttention = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can view attention needed reports'
            });
        }
        
        const { days = 7, page = 1, limit = 50 } = req.query;
        
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        const reports = await DailyReport.find({
            needsAttention: true,
            date: { $gte: dateThreshold }
        })
        .populate('child', 'name childId age gender assignedStaff')
        .populate('staff', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
        
        const total = await DailyReport.countDocuments({
            needsAttention: true,
            date: { $gte: dateThreshold }
        });
        
        // Group by child
        const childrenWithIssues = {};
        reports.forEach(report => {
            const childId = report.child._id.toString();
            if (!childrenWithIssues[childId]) {
                childrenWithIssues[childId] = {
                    child: report.child,
                    reports: []
                };
            }
            childrenWithIssues[childId].reports.push({
                date: report.date,
                healthStatus: report.healthStatus,
                behavior: report.behavior,
                specialNotes: report.specialNotes
            });
        });
        
        res.status(200).json({
            success: true,
            count: reports.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            data: Object.values(childrenWithIssues)
        });
        
    } catch (error) {
        console.error('Error fetching reports needing attention:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark attention as resolved
// @route   PUT /api/reports/:id/resolve
// @access  Private/Admin
exports.markAsResolved = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can mark reports as resolved'
            });
        }
        
        const report = await DailyReport.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Daily report not found'
            });
        }
        
        report.needsAttention = false;
        await report.save();
        
        res.status(200).json({
            success: true,
            message: 'Report marked as resolved',
            data: {
                id: report._id,
                needsAttention: false,
                child: report.child,
                date: report.date
            }
        });
        
    } catch (error) {
        console.error('Error marking report as resolved:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get daily report statistics
// @route   GET /api/reports/stats/overview
// @access  Private
exports.getReportStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Build base query based on user role
        let baseQuery = {};
        if (req.user.role === 'staff') {
            const assignedChildren = await Child.find({ 
                assignedStaff: req.user.id,
                status: 'active'
            }).select('_id');
            
            const childIds = assignedChildren.map(child => child._id);
            baseQuery.child = { $in: childIds };
        }
        
        // Today's reports
        const todaysReports = await DailyReport.countDocuments({
            ...baseQuery,
            date: { $gte: today }
        });
        
        // Last 7 days reports
        const last7DaysReports = await DailyReport.countDocuments({
            ...baseQuery,
            date: { $gte: sevenDaysAgo }
        });
        
        // Last 30 days reports
        const last30DaysReports = await DailyReport.countDocuments({
            ...baseQuery,
            date: { $gte: thirtyDaysAgo }
        });
        
        // Reports needing attention (last 7 days)
        const attentionNeeded = await DailyReport.countDocuments({
            ...baseQuery,
            needsAttention: true,
            date: { $gte: sevenDaysAgo }
        });
        
        // Health status distribution (last 30 days)
        const healthDistribution = await DailyReport.aggregate([
            { $match: { ...baseQuery, date: { $gte: thirtyDaysAgo } } },
            { $group: { 
                _id: '$healthStatus.overall', 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } }
        ]);
        
        // Behavior distribution (last 30 days)
        const behaviorDistribution = await DailyReport.aggregate([
            { $match: { ...baseQuery, date: { $gte: thirtyDaysAgo } } },
            { $group: { 
                _id: '$behavior', 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } }
        ]);
        
        // Daily reports trend (last 7 days)
        const dailyTrend = await DailyReport.aggregate([
            { $match: { ...baseQuery, date: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 },
                    attention: { $sum: { $cond: [{ $eq: ["$needsAttention", true] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Top children needing attention
        const topAttentionChildren = await DailyReport.aggregate([
            { 
                $match: { 
                    ...baseQuery, 
                    needsAttention: true,
                    date: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: '$child',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'children',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'child'
                }
            },
            { $unwind: '$child' },
            {
                $project: {
                    child: { name: 1, childId: 1, age: 1, gender: 1 },
                    attentionCount: '$count'
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totals: {
                    today: todaysReports,
                    last7Days: last7DaysReports,
                    last30Days: last30DaysReports,
                    attentionNeeded
                },
                distributions: {
                    health: healthDistribution,
                    behavior: behaviorDistribution
                },
                trends: {
                    daily: dailyTrend
                },
                topAttentionChildren
            }
        });
        
    } catch (error) {
        console.error('Error fetching report statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get monthly summary
// @route   GET /api/reports/summary/monthly
// @access  Private/Admin
exports.getMonthlySummary = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can view monthly summary'
            });
        }
        
        const { year, month } = req.query;
        const targetDate = year && month ? 
            new Date(parseInt(year), parseInt(month) - 1) : 
            new Date();
        
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        // Monthly statistics
        const monthlyStats = await DailyReport.aggregate([
            { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
            {
                $facet: {
                    // Total reports
                    totalReports: [{ $count: "count" }],
                    
                    // Reports by staff
                    byStaff: [
                        {
                            $group: {
                                _id: "$staff",
                                count: { $sum: 1 },
                                attentionCount: { $sum: { $cond: [{ $eq: ["$needsAttention", true] }, 1, 0] } }
                            }
                        },
                        { $sort: { count: -1 } },
                        {
                            $lookup: {
                                from: "users",
                                localField: "_id",
                                foreignField: "_id",
                                as: "staff"
                            }
                        },
                        { $unwind: "$staff" },
                        {
                            $project: {
                                staff: { name: 1, email: 1 },
                                count: 1,
                                attentionCount: 1
                            }
                        }
                    ],
                    
                    // Reports by child
                    byChild: [
                        {
                            $group: {
                                _id: "$child",
                                count: { $sum: 1 },
                                attentionCount: { $sum: { $cond: [{ $eq: ["$needsAttention", true] }, 1, 0] } }
                            }
                        },
                        { $sort: { attentionCount: -1, count: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: "children",
                                localField: "_id",
                                foreignField: "_id",
                                as: "child"
                            }
                        },
                        { $unwind: "$child" },
                        {
                            $project: {
                                child: { name: 1, childId: 1, age: 1, gender: 1 },
                                count: 1,
                                attentionCount: 1
                            }
                        }
                    ],
                    
                    // Daily trend
                    dailyTrend: [
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                                count: { $sum: 1 },
                                attention: { $sum: { $cond: [{ $eq: ["$needsAttention", true] }, 1, 0] } }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    
                    // Health statistics
                    healthStats: [
                        {
                            $group: {
                                _id: "$healthStatus.overall",
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } }
                    ]
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: startOfMonth,
                    end: endOfMonth,
                    month: targetDate.getMonth() + 1,
                    year: targetDate.getFullYear()
                },
                statistics: monthlyStats[0]
            }
        });
        
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};