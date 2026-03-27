const DailyReport = require('../models/DailyReport');
const Child = require('../models/Child');
const Elderly = require('../models/Elderly');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// Create new daily report
exports.createDailyReport = async (req, res) => {
    try {
        const { child, elderly, date, ...reportData } = req.body;

        if (!child && !elderly) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either a child or an elderly resident ID'
            });
        }

        // Check if resident exists
        if (child) {
            const childExists = await Child.findById(child);
            residentId = child;
            residentType = 'child';
            resident = await Child.findById(child);
            if (!resident) {
                return res.status(404).json({
                    success: false,
                    message: 'Child not found'
                });
            }
            // Verification: Only assigned staff can create reports for children
            if (req.user.role === 'staff' && resident.assignedStaff?.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not authorized to create reports for unassigned children' });
            }
        } else if (elderly) {
            residentId = elderly;
            residentType = 'elderly';
            resident = await Elderly.findById(elderly);
            if (!resident) {
                return res.status(404).json({
                    success: false,
                    message: 'Elderly resident not found'
                });
            }
            // Verification: Only assigned staff can create reports for elderly residents
            if (req.user.role === 'staff' && resident.assignedStaff?.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not authorized to create reports for unassigned elderly residents' });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please provide either a child or an elderly resident ID'
            });
        }

        // Check if report already exists for the day
        const query = {
            date: new Date(date).setHours(0, 0, 0, 0)
        };
        if (child) query.child = child;
        if (elderly) query.elderly = elderly;

        const existingReport = await DailyReport.findOne(query);

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: `Daily report already exists for this ${child ? 'child' : 'elderly resident'} today`
            });
        }

        // Add staff ID from token
        reportData.staff = req.user.id;

        // Sanitize meals (convert "" to undefined)
        if (reportData.morningMeal === '') reportData.morningMeal = undefined;
        if (reportData.afternoonMeal === '') reportData.afternoonMeal = undefined;
        if (reportData.eveningMeal === '') reportData.eveningMeal = undefined;

        // Sanitize healthStatus
        if (reportData.healthStatus) {
            if (reportData.healthStatus.temperature === '') reportData.healthStatus.temperature = undefined;
            if (reportData.healthStatus.overall === '') reportData.healthStatus.overall = undefined;
        }

        // Sanitize behavior
        if (reportData.behavior === '') reportData.behavior = undefined;

        // Create report
        const report = await DailyReport.create({
            ...reportData,
            child: child || undefined,
            elderly: elderly || undefined,
            date: new Date(date)
        });

        // If health status is poor, mark as needs attention
        if (reportData.healthStatus?.overall === 'poor' || reportData.behavior === 'needs_attention') {
            report.needsAttention = true;
            await report.save();
        }

        // Notify admins
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'New Daily Report',
                message: `Staff ${req.user.name} added a daily report for ${resident.name} (${residentType})`,
                type: 'report',
                data: { reportId: report._id, residentId: resident._id, residentType },
                createdBy: req.user._id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Daily report added successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding daily report',
            error: error.message
        });
    }
};

// Get all daily reports with filters
exports.getAllDailyReports = async (req, res) => {
    try {
        const {
            child,
            elderly,
            staff,
            startDate,
            endDate,
            needsAttention,
            page = 1,
            limit = 20
        } = req.query;

        let query = {};

        // Apply filters
        if (child) query.child = child;
        if (elderly) query.elderly = elderly;
        if (staff) query.staff = staff;
        if (needsAttention !== undefined) query.needsAttention = needsAttention === 'true';

        // Restriction for staff role: only see their own reports
        if (req.user.role === 'staff') {
            query.staff = req.user.id;
        }

        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const reports = await DailyReport.find(query)
            .populate('child', 'name age gender childId')
            .populate('elderly', 'name age gender')
            .populate('staff', 'name email')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await DailyReport.countDocuments(query);

        // Fetch stats for the dashboard
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayReports = await DailyReport.countDocuments({
            date: { $gte: today }
        });

        const attentionNeeded = await DailyReport.countDocuments({
            needsAttention: true
        });

        const healthStats = await DailyReport.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$healthStatus.overall',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
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
        res.status(500).json({
            success: false,
            message: 'Error fetching daily reports',
            error: error.message
        });
    }
};

// Get report by ID
exports.getDailyReportById = async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id)
            .populate('child', 'name age gender childId photo')
            .populate('elderly', 'name age gender photo')
            .populate('staff', 'name email phone');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching report',
            error: error.message
        });
    }
};

// Update report
exports.updateDailyReport = async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check if user is authorized (staff who created or admin)
        if (report.staff.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this report'
            });
        }

        const updatedReport = await DailyReport.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('child', 'name')
            .populate('elderly', 'name');

        // Update needs attention flag
        if (req.body.healthStatus?.overall === 'poor' || req.body.behavior === 'needs_attention') {
            updatedReport.needsAttention = true;
            await updatedReport.save();
        }

        // Notify admins if updated by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Daily Report Updated',
                message: `Staff ${req.user.name} updated the daily report for ${updatedReport.child?.name || updatedReport.elderly?.name}`,
                type: 'report',
                data: { reportId: updatedReport._id },
                createdBy: req.user._id
            });
        }

        res.json({
            success: true,
            message: 'Report updated successfully',
            data: updatedReport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating report',
            error: error.message
        });
    }
};

// Delete report
exports.deleteDailyReport = async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check if user is authorized (admin only)
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can delete reports'
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting report',
            error: error.message
        });
    }
};

// Get reports by resident ID
exports.getReportsByResident = async (req, res) => {
    try {
        const { residentId, type } = req.params;
        const { limit = 30 } = req.query;

        const query = type === 'elderly' ? { elderly: residentId } : { child: residentId };

        const reports = await DailyReport.find(query)
            .populate('staff', 'name')
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error fetching ${type} reports`,
            error: error.message
        });
    }
};

// Get reports needing attention
exports.getReportsNeedingAttention = async (req, res) => {
    try {
        const reports = await DailyReport.find({ needsAttention: true })
            .populate('child', 'name age gender childId')
            .populate('elderly', 'name age gender')
            .populate('staff', 'name')
            .sort({ date: -1 })
            .limit(50);

        res.json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reports needing attention',
            error: error.message
        });
    }
};

// Mark attention as resolved
exports.markAsResolved = async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        report.needsAttention = false;
        await report.save();

        res.json({
            success: true,
            message: 'Report marked as resolved'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating report',
            error: error.message
        });
    }
};

// Get report statistics
exports.getReportStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayReports = await DailyReport.countDocuments({
            date: { $gte: today }
        });

        const attentionNeeded = await DailyReport.countDocuments({
            needsAttention: true,
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        const totalReports = await DailyReport.countDocuments();

        // Fetch recent reports for dashboard
        const reports = await DailyReport.find()
            .populate('child', 'name')
            .populate('elderly', 'name')
            .sort({ date: -1, createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                todayReports,
                attentionNeeded,
                totalReports
            },
            reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
    try {
        const { year, month } = req.query;
        const targetDate = year && month ?
            new Date(parseInt(year), parseInt(month) - 1) :
            new Date();

        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        const reports = await DailyReport.countDocuments({
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        res.json({
            success: true,
            data: {
                month: targetDate.getMonth() + 1,
                year: targetDate.getFullYear(),
                count: reports
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly summary',
            error: error.message
        });
    }
};

// Get health distribution stats
exports.getHealthDistribution = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const healthStats = await DailyReport.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: '$healthStatus.overall',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Transform results to expected format
        const distribution = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0
        };

        healthStats.forEach(stat => {
            if (stat._id && distribution.hasOwnProperty(stat._id)) {
                distribution[stat._id] = stat.count;
            }
        });

        res.json({
            success: true,
            data: distribution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching health distribution',
            error: error.message
        });
    }
};
