const DailyReport = require('../models/DailyReport');
const Child = require('../models/Child');
const User = require('../models/User');

// Create new daily report
exports.createDailyReport = async (req, res) => {
    try {
        const { child, date, ...reportData } = req.body;

        // Check if child exists
        const childExists = await Child.findById(child);
        if (!childExists) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Check if report already exists for the day
        const existingReport = await DailyReport.findOne({
            child,
            date: new Date(date).setHours(0, 0, 0, 0)
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'Daily report already exists for this child today'
            });
        }

        // Add staff ID from token
        reportData.staff = req.user.id;

        // Create report
        const report = await DailyReport.create({
            ...reportData,
            child,
            date: new Date(date)
        });

        // If health status is poor, mark as needs attention
        if (reportData.healthStatus?.overall === 'poor' || reportData.behavior === 'needs_attention') {
            report.needsAttention = true;
            await report.save();
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
        if (staff) query.staff = staff;
        if (needsAttention !== undefined) query.needsAttention = needsAttention === 'true';

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
            .populate('staff', 'name email')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await DailyReport.countDocuments(query);

        res.json({
            success: true,
            count: reports.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
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
        ).populate('child', 'name');

        // Update needs attention flag
        if (req.body.healthStatus?.overall === 'poor' || req.body.behavior === 'needs_attention') {
            updatedReport.needsAttention = true;
            await updatedReport.save();
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

// Get reports by child ID
exports.getReportsByChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { limit = 30 } = req.query;

        const reports = await DailyReport.find({ child: childId })
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
            message: 'Error fetching child reports',
            error: error.message
        });
    }
};

// Get reports needing attention
exports.getReportsNeedingAttention = async (req, res) => {
    try {
        const reports = await DailyReport.find({ needsAttention: true })
            .populate('child', 'name age gender childId')
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

        res.json({
            success: true,
            data: {
                todayReports,
                attentionNeeded,
                totalReports
            }
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