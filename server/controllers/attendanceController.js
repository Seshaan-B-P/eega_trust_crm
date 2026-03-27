const Attendance = require('../models/Attendance');
const Child = require('../models/Child');
const Elderly = require('../models/Elderly');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification } = require('../utils/notificationHelper');


// @desc    Mark attendance for a child
// @route   POST /api/attendance
// @access  Private (Staff & Admin)
exports.markAttendance = async (req, res) => {
    try {
        const { child, elderly, date, status, remarks, temperature, symptoms, medication } = req.body;

        if (!child && !elderly) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either a child or an elderly resident ID'
            });
        }

        let residentDoc;
        if (child) {
            residentDoc = await Child.findOne({ _id: child, status: 'active' });
        } else {
            residentDoc = await Elderly.findOne({ _id: elderly, status: 'Active' });
        }

        if (!residentDoc) {
            return res.status(404).json({
                success: false,
                message: `${child ? 'Child' : 'Elderly resident'} not found or not active`
            });
        }

        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance already marked for today
        const query = { date: attendanceDate };
        if (child) query.child = child;
        if (elderly) query.elderly = elderly;

        const existingAttendance = await Attendance.findOne(query);

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: `Attendance already marked for this ${child ? 'child' : 'elderly resident'} today`
            });
        }

        // Create attendance record
        const attendance = await Attendance.create({
            child: child || undefined,
            elderly: elderly || undefined,
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
            .populate('elderly', 'name age gender')
            .populate('markedBy', 'name email');

        // Notify admins if marked by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Attendance Marked',
                message: `Staff ${req.user.name} marked attendance for ${residentDoc.name} (${child ? 'child' : 'elderly'}) as ${status}`,
                type: 'attendance',
                data: { attendanceId: attendance._id, residentId: residentDoc._id, residentType: child ? 'child' : 'elderly' },
                createdBy: req.user.id
            });
        }

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
                message: 'Attendance already marked for this resident today'
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

        // Validate all residents exist and are active
        const childIds = attendanceList.filter(item => item.child).map(item => item.child);
        const elderlyIds = attendanceList.filter(item => item.elderly).map(item => item.elderly);

        if (childIds.length > 0) {
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
        }

        if (elderlyIds.length > 0) {
            const elderlyMatched = await Elderly.find({
                _id: { $in: elderlyIds },
                status: 'Active'
            });

            if (elderlyMatched.length !== elderlyIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more elderly residents not found or not active'
                });
            }
        }

        // Check authorization for staff
        // Note: Removed strict assignedStaff authorization for staff to allow broader attendance marking
        /*
        if (req.user.role === 'staff') {
            const assignedChildren = await Child.find({
                assignedStaff: req.user.id,
                status: 'active'
            }).select('_id');

            const assignedElderly = await Elderly.find({
                assignedStaff: req.user.id,
                status: 'Active'
            }).select('_id');

            const assignedChildIds = assignedChildren.map(c => c._id.toString());
            const assignedElderlyIds = assignedElderly.map(e => e._id.toString());

            const unauthorizedResidents = attendanceList.filter(item => {
                if (item.child) return !assignedChildIds.includes(item.child);
                if (item.elderly) return !assignedElderlyIds.includes(item.elderly);
                return false;
            });

            if (unauthorizedResidents.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to mark attendance for some residents'
                });
            }
        }
        */

        // Prepare attendance data
        const attendanceData = attendanceList.map(item => ({
            child: item.child || undefined,
            elderly: item.elderly || undefined,
            date: date || new Date(),
            status: item.status || 'present',
            remarks: item.remarks,
            temperature: item.temperature
        }));

        // Mark bulk attendance
        const result = await Attendance.markBulkAttendance(attendanceData, req.user.id);

        // Get updated records
        const markedDate = new Date(date || new Date());
        markedDate.setHours(0, 0, 0, 0);

        const updatedAttendance = await Attendance.find({
            $or: [
                { child: { $in: attendanceList.filter(i => i.child).map(i => i.child) } },
                { elderly: { $in: attendanceList.filter(i => i.elderly).map(i => i.elderly) } }
            ],
            date: markedDate
        })
            .populate('child', 'name childId')
            .populate('elderly', 'name')
            .populate('markedBy', 'name');

        // Notify admins if marked by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Bulk Attendance Marked',
                message: `Staff ${req.user.name} marked bulk attendance for ${attendanceList.length} residents`,
                type: 'attendance',
                data: { count: attendanceList.length, date: markedDate },
                createdBy: req.user.id
            });
        }

        res.status(201).json({
            success: true,
            message: `Attendance marked for ${result.upsertedCount + result.modifiedCount} residents`,
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
            elderly,
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

        // Resident filters
        if (child && mongoose.Types.ObjectId.isValid(child)) {
            query.child = child;
        }
        if (elderly && mongoose.Types.ObjectId.isValid(elderly)) {
            query.elderly = elderly;
        }

        // Date range filter
        const { date } = req.query;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else if (startDate || endDate) {
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

        // Staff can only see attendance for their assigned residents
        // Note: Removed strict assignedStaff filter for staff in attendance records
        /*
        if (req.user.role === 'staff') {
            const assignedChildren = await Child.find({
                assignedStaff: req.user.id,
                status: 'active'
            }).select('_id');

            const assignedElderly = await Elderly.find({
                assignedStaff: req.user.id,
                status: 'Active'
            }).select('_id');

            const childIds = assignedChildren.map(c => c._id);
            const elderlyIds = assignedElderly.map(e => e._id);
            
            query.$or = [
                { child: { $in: childIds } },
                { elderly: { $in: elderlyIds } }
            ];
        }
        */

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
            .populate('elderly', 'name age gender photo')
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
            .populate('elderly', 'name age gender assignedStaff medicalConditions dietaryRestrictions')
            .populate('markedBy', 'name email phone')
            .populate('verifiedBy', 'name email')
            .lean();

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        // Note: Relaxed restrictive staff check for viewing individual attendance records
        /*
        if (req.user.role === 'staff') {
            const child = await Child.findById(attendance.child._id);
            if (child.assignedStaff?.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this attendance record'
                });
            }
        }
        */

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
        const updateData = { ...req.body };
        // If status is present and check-in time isn't set, set it to now
        if (updateData.status === 'present' && !updateData.checkInTime && !attendance.checkInTime) {
            updateData.checkInTime = new Date();
        }

        const updatedAttendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            updateData,
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
        let elderlyQuery = { status: 'Active' };
        
        // Note: Removed strict assignedStaff filter for today's summary to allow staff to see all residents
        /*
        if (req.user.role === 'staff') {
            childQuery.assignedStaff = req.user.id;
            elderlyQuery.assignedStaff = req.user.id;
        }
        */

        // Get all active residents
        const children = await Child.find(childQuery)
            .select('name childId age gender assignedStaff photo')
            .populate('assignedStaff', 'name')
            .lean();

        const elderly = await Elderly.find(elderlyQuery)
            .select('name age gender assignedStaff photo')
            .populate('assignedStaff', 'name')
            .lean();

        // Get today's attendance for these residents
        const todayAttendance = await Attendance.find({
            $or: [
                { child: { $in: children.map(c => c._id) } },
                { elderly: { $in: elderly.map(e => e._id) } }
            ],
            date: { $gte: today, $lt: tomorrow }
        })
            .select('child elderly status remarks')
            .lean();

        // Create a map of attendance
        const attendanceMap = {};
        todayAttendance.forEach(record => {
            if (record.child) {
                attendanceMap[`child_${record.child.toString()}`] = record;
            } else if (record.elderly) {
                attendanceMap[`elderly_${record.elderly.toString()}`] = record;
            }
        });

        // Combine residents with their attendance
        const childrenSummary = children.map(c => ({
            type: 'child',
            resident: c,
            attendance: attendanceMap[`child_${c._id.toString()}`] || null,
            isMarked: !!attendanceMap[`child_${c._id.toString()}`]
        }));

        const elderlySummary = elderly.map(e => ({
            type: 'elderly',
            resident: e,
            attendance: attendanceMap[`elderly_${e._id.toString()}`] || null,
            isMarked: !!attendanceMap[`elderly_${e._id.toString()}`]
        }));

        const summary = [...childrenSummary, ...elderlySummary];

        // Calculate statistics
        const totalResidents = summary.length;
        const markedCount = summary.filter(item => item.isMarked).length;
        const pendingCount = totalResidents - markedCount;

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
                totalResidents,
                marked: markedCount,
                pending: pendingCount,
                statusCounts,
                summary,
                childrenSummary,
                elderlySummary
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
        let residentMatch = {};
        // Note: Removed strict assignedStaff filter for staff to allow them to see global stats
        /*
        if (req.user.role === 'staff') {
            const assignedChildren = await Child.find({ assignedStaff: req.user.id, status: 'active' }).select('_id');
            const assignedElderly = await Elderly.find({ assignedStaff: req.user.id, status: 'Active' }).select('_id');
            const childIds = assignedChildren.map(c => c._id);
            const elderlyIds = assignedElderly.map(e => e._id);
            
            residentMatch = {
                $or: [
                    { child: { $in: childIds } },
                    { elderly: { $in: elderlyIds } }
                ]
            };
        }
        */

        const totalActiveChildren = await Child.countDocuments({ status: 'active' });
        const totalActiveElderly = await Elderly.countDocuments({ status: 'Active' });

        // Today's attendance
        const todaysAttendance = await Attendance.countDocuments({
            ...residentMatch,
            date: { $gte: today },
            status: 'present'
        });

        // Last 7 days statistics
        const last7DaysStats = await Attendance.aggregate([
            {
                $match: {
                    ...residentMatch,
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
                    ...residentMatch,
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
                    ...residentMatch,
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
        const childQuery = req.user.role === 'staff' ? { assignedStaff: req.user.id, status: 'active' } : { status: 'active' };
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
                    totalChildren: totalActiveChildren,
                    totalElderly: totalActiveElderly,
                    totalActive: totalActiveChildren + totalActiveElderly
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
        const { year, month } = req.query;
        const targetDate = year && month ?
            new Date(parseInt(year), parseInt(month) - 1) :
            new Date();

        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        // Get all active residents
        const [children, elderly] = await Promise.all([
            Child.find({ status: 'active' }).select('name childId age gender assignedStaff').populate('assignedStaff', 'name').lean(),
            Elderly.find({ status: 'Active' }).select('name age gender assignedStaff').populate('assignedStaff', 'name').lean()
        ]);

        // Get attendance for the month
        const attendance = await Attendance.find({
            $or: [
                { child: { $in: children.map(child => child._id) } },
                { elderly: { $in: elderly.map(e => e._id) } }
            ],
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).lean();

        // Create attendance map for quick lookup
        const attendanceMap = {};
        attendance.forEach(record => {
            const key = record.child ? record.child.toString() : record.elderly.toString();
            if (!attendanceMap[key]) {
                attendanceMap[key] = {};
            }
            const dateStr = record.date.toISOString().split('T')[0];
            attendanceMap[key][dateStr] = record.status;
        });

        // Helper to generate report for a resident
        const generateReport = (resident, type) => {
            const resAttendance = attendanceMap[resident._id.toString()] || {};
            let presentDays = 0;
            let absentDays = 0;
            let sickDays = 0;
            let leaveDays = 0;
            let halfDays = 0;

            const daysInMonth = endOfMonth.getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
                const dateStr = currentDate.toISOString().split('T')[0];
                const status = resAttendance[dateStr];

                if (status === 'present') presentDays++;
                else if (status === 'absent') absentDays++;
                else if (status === 'sick') sickDays++;
                else if (status === 'leave') leaveDays++;
                else if (status === 'half_day') halfDays++;
                else absentDays++;
            }

            const totalDays = daysInMonth;
            const attendancePercentage = ((presentDays + (halfDays * 0.5)) / totalDays) * 100;

            return {
                type,
                resident: {
                    name: resident.name,
                    id: resident.childId || resident._id, // Use childId if available, else mongo _id
                    age: resident.age,
                    gender: resident.gender,
                    assignedStaff: resident.assignedStaff
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
        };

        const reports = [
            ...children.map(c => generateReport(c, 'child')),
            ...elderly.map(e => generateReport(e, 'elderly'))
        ];

        // Calculate overall statistics
        const overallStats = reports.reduce((stats, report) => {
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
                reports: reports.sort((a, b) => b.attendance.percentage - a.attendance.percentage)
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