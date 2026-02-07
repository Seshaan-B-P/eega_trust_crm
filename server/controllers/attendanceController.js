const Attendance = require('../models/Attendance');
const Child = require('../models/Child');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Mark attendance for a child
// @route   POST /api/attendance
// @access  Private (Staff & Admin)
exports.markAttendance = async (req, res) => {
    try {
        const { child, date, status, remarks, temperature, symptoms, medication } = req.body;
        
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
        
        // Check authorization for staff
        if (req.user.role === 'staff') {
            const isAssigned = childDoc.assignedStaff?.toString() === req.user.id;
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to mark attendance for this child'
                });
            }
        }
        
        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        
        // Check if attendance already marked for today
        const existingAttendance = await Attendance.findOne({
            child,
            date: attendanceDate
        });
        
        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this child today'
            });
        }
        
        // Create attendance record
        const attendance = await Attendance.create({
            child,
            date: attendanceDate,
            status,
            remarks,
            temperature,
            symptoms: symptoms || [],
            medication,
            markedBy: req.user.id
        });
        
        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('child', 'name childId age gender')
            .populate('markedBy', 'name email');
        
        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: populatedAttendance
        });
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this child today'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark bulk attendance for multiple children
// @route   POST /api/attendance/bulk
// @access  Private (Staff & Admin)
exports.markBulkAttendance = async (req, res) => {
    try {
        const { date, attendanceList } = req.body;
        
        if (!attendanceList || !Array.isArray(attendanceList) || attendanceList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance list is required'
            });
        }
        
        // Validate all children exist and are active
        const childIds = attendanceList.map(item => item.child);
        const children = await Child.find({
            _id: { $in: childIds },
            status: 'active'
        });
        
        if (children.length !== childIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more children not found or not active'
            });
        }
        
        // Check authorization for staff
        if (req.user.role === 'staff') {
            const assignedChildren = await Child.find({
                assignedStaff: req.user.id,
                status: 'active'
            }).select('_id');
            
            const assignedChildIds = assignedChildren.map(child => child._id.toString());
            
            const unauthorizedChildren = attendanceList.filter(item => 
                !assignedChildIds.includes(item.child)
            );
            
            if (unauthorizedChildren.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to mark attendance for some children'
                });
            }
        }
        
        // Prepare attendance data
        const attendanceData = attendanceList.map(item => ({
            child: item.child,
            date: date || new Date(),
            status: item.status || 'present',
            remarks: item.remarks
        }));
        
        // Mark bulk attendance
        const result = await Attendance.markBulkAttendance(attendanceData, req.user.id);
        
        // Get updated records
        const markedDate = new Date(date || new Date());
        markedDate.setHours(0, 0, 0, 0);
        
        const updatedAttendance = await Attendance.find({
            child: { $in: childIds },
            date: markedDate
        })
        .populate('child', 'name childId')
        .populate('markedBy', 'name');
        
        res.status(201).json({
            success: true,
            message: `Attendance marked for ${result.upsertedCount + result.modifiedCount} children`,
            data: {
                inserted: result.upsertedCount,
                modified: result.modifiedCount,
                attendance: updatedAttendance
            }
        });
        
    } catch (error) {
        console.error('Error marking bulk attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get attendance records with filters
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
    try {
        const {
            child,
            startDate,
            endDate,
            status,
            markedBy,
            page = 1,
            limit = 30,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;
        
        // Build query
        let query = {};
        
        // Child filter
        if (child && mongoose.Types.ObjectId.isValid(child)) {
            query.child = child;
        }
        
        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        } else {
            // Default to last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.date = { $gte: thirtyDaysAgo };
        }
        
        // Status filter
        if (status) {
            query.status = status;
        }
        
        // Marked by filter
        if (markedBy && mongoose.Types.ObjectId.isValid(markedBy)) {
            query.markedBy = markedBy;
        }
        
        // Staff can only see attendance for their assigned children
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
        const attendance = await Attendance.find(query)
            .populate('child', 'name childId age gender photo')
            .populate('markedBy', 'name email')
            .populate('verifiedBy', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();
        
        const total = await Attendance.countDocuments(query);
        
        // Get statistics
        const stats = await Attendance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Calculate attendance percentage
        const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);
        const presentRecords = stats.find(stat => stat._id === 'present')?.count || 0;
        const halfDayRecords = stats.find(stat => stat._id === 'half_day')?.count || 0;
        
        const attendancePercentage = totalRecords > 0 ? 
            ((presentRecords + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;
        
        res.status(200).json({
            success: true,
            count: attendance.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            stats: {
                total: totalRecords,
                distribution: stats,
                percentage: attendancePercentage.toFixed(2)
            },
            data: attendance
        });
        
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendanceById = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id)
            .populate('child', 'name childId age gender assignedStaff medicalHistory allergies')
            .populate('markedBy', 'name email phone')
            .populate('verifiedBy', 'name email')
            .lean();
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        // Check authorization for staff
        if (req.user.role === 'staff') {
            const child = await Child.findById(attendance.child._id);
            if (child.assignedStaff?.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this attendance record'
                });
            }
        }
        
        res.status(200).json({
            success: true,
            data: attendance
        });
        
    } catch (error) {
        console.error('Error fetching attendance:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
exports.updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        // Check authorization
        if (req.user.role === 'staff') {
            // Staff can only update their own records
            if (attendance.markedBy.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this attendance record'
                });
            }
            
            // Staff can't change child or date
            if (req.body.child || req.body.date) {
                return res.status(403).json({
                    success: false,
                    message: 'Staff cannot change child or date of attendance'
                });
            }
        }
        
        // Update attendance
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('child', 'name childId')
        .populate('markedBy', 'name');
        
        res.status(200).json({
            success: true,
            message: 'Attendance updated successfully',
            data: updatedAttendance
        });
        
    } catch (error) {
        console.error('Error updating attendance:', error);
        
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
                message: 'Invalid attendance ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
exports.deleteAttendance = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can delete attendance records'
            });
        }
        
        const attendance = await Attendance.findById(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        await attendance.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Attendance record deleted successfully',
            data: {
                id: attendance._id,
                child: attendance.child,
                date: attendance.date
            }
        });
        
    } catch (error) {
        console.error('Error deleting attendance:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Verify attendance record
// @route   PUT /api/attendance/:id/verify
// @access  Private/Admin
exports.verifyAttendance = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can verify attendance'
            });
        }
        
        const attendance = await Attendance.findById(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        attendance.verifiedBy = req.user.id;
        attendance.verificationDate = new Date();
        await attendance.save();
        
        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('verifiedBy', 'name email');
        
        res.status(200).json({
            success: true,
            message: 'Attendance verified successfully',
            data: populatedAttendance
        });
        
    } catch (error) {
        console.error('Error verifying attendance:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get today's attendance summary
// @route   GET /api/attendance/today/summary
// @access  Private
exports.getTodaySummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Build base query based on user role
        let childQuery = { status: 'active' };
        if (req.user.role === 'staff') {
            childQuery.assignedStaff = req.user.id;
        }
        
        // Get all active children (or assigned children for staff)
        const children = await Child.find(childQuery)
            .select('name childId age gender assignedStaff')
            .populate('assignedStaff', 'name')
            .lean();
        
        // Get today's attendance for these children
        const todayAttendance = await Attendance.find({
            child: { $in: children.map(child => child._id) },
            date: { $gte: today, $lt: tomorrow }
        })
        .select('child status remarks')
        .lean();
        
        // Create a map of child attendance
        const attendanceMap = {};
        todayAttendance.forEach(record => {
            attendanceMap[record.child.toString()] = record;
        });
        
        // Combine children with their attendance
        const summary = children.map(child => ({
            child: {
                _id: child._id,
                name: child.name,
                childId: child.childId,
                age: child.age,
                gender: child.gender,
                assignedStaff: child.assignedStaff
            },
            attendance: attendanceMap[child._id.toString()] || null,
            isMarked: !!attendanceMap[child._id.toString()]
        }));
        
        // Calculate statistics
        const totalChildren = summary.length;
        const markedCount = summary.filter(item => item.isMarked).length;
        const pendingCount = totalChildren - markedCount;
        
        const statusCounts = summary.reduce((counts, item) => {
            if (item.attendance) {
                counts[item.attendance.status] = (counts[item.attendance.status] || 0) + 1;
            }
            return counts;
        }, {});
        
        res.status(200).json({
            success: true,
            data: {
                date: today,
                totalChildren,
                marked: markedCount,
                pending: pendingCount,
                statusCounts,
                summary
            }
        });
        
    } catch (error) {
        console.error('Error fetching today\'s summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats/overview
// @access  Private
exports.getAttendanceStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Build base query based on user role
        let childQuery = { status: 'active' };
        if (req.user.role === 'staff') {
            childQuery.assignedStaff = req.user.id;
        }
        
        const children = await Child.find(childQuery).select('_id');
        const childIds = children.map(child => child._id);
        
        // Today's attendance
        const todaysAttendance = await Attendance.countDocuments({
            child: { $in: childIds },
            date: { $gte: today }
        });
        
        // Last 7 days statistics
        const last7DaysStats = await Attendance.aggregate([
            { 
                $match: { 
                    child: { $in: childIds },
                    date: { $gte: sevenDaysAgo }
                } 
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Last 30 days daily trend
        const last30DaysTrend = await Attendance.aggregate([
            { 
                $match: { 
                    child: { $in: childIds },
                    date: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    present: { 
                        $sum: { 
                            $cond: [{ $in: ["$status", ["present", "half_day"]] }, 1, 0] 
                        } 
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Monthly attendance percentage
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyStats = await Attendance.aggregate([
            { 
                $match: { 
                    child: { $in: childIds },
                    date: { $gte: currentMonthStart }
                } 
            },
            {
                $group: {
                    _id: null,
                    presentDays: { 
                        $sum: { 
                            $cond: [{ $in: ["$status", ["present", "half_day"]] }, 1, 0] 
                        } 
                    },
                    totalDays: { $sum: 1 }
                }
            }
        ]);
        
        const monthlyPercentage = monthlyStats.length > 0 ? 
            (monthlyStats[0].presentDays / monthlyStats[0].totalDays) * 100 : 0;
        
        // Children with low attendance (below 80% in last 30 days)
        const lowAttendanceChildren = await Child.aggregate([
            { $match: childQuery },
            {
                $lookup: {
                    from: "attendances",
                    let: { childId: "$_id" },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { 
                                    $and: [
                                        { $eq: ["$child", "$$childId"] },
                                        { $gte: ["$date", thirtyDaysAgo] }
                                    ]
                                }
                            } 
                        },
                        {
                            $group: {
                                _id: null,
                                presentDays: { 
                                    $sum: { 
                                        $cond: [{ $in: ["$status", ["present", "half_day"]] }, 1, 0] 
                                    } 
                                },
                                totalDays: { $sum: 1 }
                            }
                        }
                    ],
                    as: "attendance"
                }
            },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    attendancePercentage: {
                        $cond: [
                            { $gt: ["$attendance.totalDays", 0] },
                            { $multiply: [{ $divide: ["$attendance.presentDays", "$attendance.totalDays"] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $match: { attendancePercentage: { $lt: 80 } } },
            { $sort: { attendancePercentage: 1 } },
            { $limit: 10 },
            {
                $project: {
                    name: 1,
                    childId: 1,
                    age: 1,
                    gender: 1,
                    assignedStaff: 1,
                    attendancePercentage: { $round: ["$attendancePercentage", 2] }
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totals: {
                    today: todaysAttendance,
                    totalChildren: childIds.length
                },
                last7Days: last7DaysStats,
                trends: {
                    daily: last30DaysTrend
                },
                monthly: {
                    percentage: monthlyPercentage.toFixed(2),
                    ...(monthlyStats[0] || { presentDays: 0, totalDays: 0 })
                },
                lowAttendanceChildren
            }
        });
        
    } catch (error) {
        console.error('Error fetching attendance statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get monthly attendance report
// @route   GET /api/attendance/report/monthly
// @access  Private/Admin
exports.getMonthlyReport = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can view monthly reports'
            });
        }
        
        const { year, month } = req.query;
        const targetDate = year && month ? 
            new Date(parseInt(year), parseInt(month) - 1) : 
            new Date();
        
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        // Get all active children
        const children = await Child.find({ status: 'active' })
            .select('name childId age gender assignedStaff')
            .populate('assignedStaff', 'name')
            .lean();
        
        // Get attendance for the month
        const attendance = await Attendance.find({
            child: { $in: children.map(child => child._id) },
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).lean();
        
        // Create attendance map for quick lookup
        const attendanceMap = {};
        attendance.forEach(record => {
            if (!attendanceMap[record.child]) {
                attendanceMap[record.child] = {};
            }
            const dateStr = record.date.toISOString().split('T')[0];
            attendanceMap[record.child][dateStr] = record.status;
        });
        
        // Generate report for each child
        const childReports = children.map(child => {
            const childAttendance = attendanceMap[child._id] || {};
            let presentDays = 0;
            let absentDays = 0;
            let sickDays = 0;
            let leaveDays = 0;
            let halfDays = 0;
            
            // Calculate days in month
            const daysInMonth = endOfMonth.getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
                const dateStr = currentDate.toISOString().split('T')[0];
                const status = childAttendance[dateStr];
                
                if (status === 'present') presentDays++;
                else if (status === 'absent') absentDays++;
                else if (status === 'sick') sickDays++;
                else if (status === 'leave') leaveDays++;
                else if (status === 'half_day') halfDays++;
                // If no attendance marked, count as absent
                else absentDays++;
            }
            
            const totalDays = daysInMonth;
            const attendancePercentage = ((presentDays + (halfDays * 0.5)) / totalDays) * 100;
            
            return {
                child: {
                    name: child.name,
                    childId: child.childId,
                    age: child.age,
                    gender: child.gender,
                    assignedStaff: child.assignedStaff
                },
                attendance: {
                    present: presentDays,
                    absent: absentDays,
                    sick: sickDays,
                    leave: leaveDays,
                    halfDay: halfDays,
                    total: totalDays,
                    percentage: attendancePercentage.toFixed(2)
                }
            };
        });
        
        // Calculate overall statistics
        const overallStats = childReports.reduce((stats, report) => {
            stats.totalPresent += report.attendance.present;
            stats.totalAbsent += report.attendance.absent;
            stats.totalSick += report.attendance.sick;
            stats.totalLeave += report.attendance.leave;
            stats.totalHalfDay += report.attendance.halfDay;
            stats.totalDays += report.attendance.total;
            return stats;
        }, {
            totalPresent: 0,
            totalAbsent: 0,
            totalSick: 0,
            totalLeave: 0,
            totalHalfDay: 0,
            totalDays: 0
        });
        
        overallStats.averagePercentage = 
            ((overallStats.totalPresent + (overallStats.totalHalfDay * 0.5)) / overallStats.totalDays) * 100;
        
        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: startOfMonth,
                    end: endOfMonth,
                    month: targetDate.getMonth() + 1,
                    year: targetDate.getFullYear()
                },
                overall: overallStats,
                reports: childReports.sort((a, b) => b.attendance.percentage - a.attendance.percentage)
            }
        });
        
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};