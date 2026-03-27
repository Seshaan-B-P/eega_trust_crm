const StaffAttendance = require('../models/StaffAttendance');
const Staff = require('../models/Staff');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Mark bulk attendance for multiple staff
// @route   POST /api/staff-attendance/bulk
// @access  Private/Admin
exports.markStaffBulkAttendance = async (req, res) => {
    try {
        const { date, attendanceList } = req.body;

        if (!attendanceList || !Array.isArray(attendanceList) || attendanceList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance list is required'
            });
        }

        // Validate all staff exist
        const staffIds = attendanceList.map(item => item.staff);
        const staffUsers = await User.find({
            _id: { $in: staffIds },
            role: 'staff'
        });

        if (staffUsers.length !== staffIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more users not found or do not have staff role'
            });
        }

        // Prepare attendance data
        const attendanceDate = new Date(date || new Date());
        attendanceDate.setHours(0, 0, 0, 0);

        const attendanceData = await Promise.all(attendanceList.map(async (item) => {
            // Find corresponding staff profile for each user
            const profile = await Staff.findOne({ user: item.staff });
            return {
                staff: item.staff,
                staffProfile: profile ? profile._id : null,
                date: attendanceDate,
                status: item.status || 'present',
                remarks: item.remarks || ''
            };
        }));

        // Filter out items where profile wasn't found (optional, but safer)
        const validAttendanceData = attendanceData.filter(item => item.staffProfile !== null);

        if (validAttendanceData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid staff profiles found for the provided user IDs'
            });
        }

        // Mark bulk attendance
        const result = await StaffAttendance.markBulkAttendance(validAttendanceData, req.user.id);

        // Get updated records
        const updatedAttendance = await StaffAttendance.find({
            staff: { $in: staffIds },
            date: attendanceDate
        })
            .populate('staff', 'name email phone')
            .populate('staffProfile', 'employeeId designation department')
            .populate('markedBy', 'name');

        res.status(201).json({
            success: true,
            message: `Staff attendance marked for ${result.upsertedCount + result.modifiedCount} employees`,
            data: {
                inserted: result.upsertedCount,
                modified: result.modifiedCount,
                attendance: updatedAttendance
            }
        });

    } catch (error) {
        console.error('Error marking staff bulk attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get staff attendance records with filters
// @route   GET /api/staff-attendance
// @access  Private/Admin
exports.getStaffAttendance = async (req, res) => {
    try {
        const {
            staff,
            startDate,
            endDate,
            status,
            department,
            page = 1,
            limit = 30,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        // Staff (User ID) filter
        if (staff && mongoose.Types.ObjectId.isValid(staff)) {
            query.staff = staff;
        }

        // Date filter (single day or range)
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
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const attendance = await StaffAttendance.find(query)
            .populate('staff', 'name email phone')
            .populate('staffProfile', 'employeeId designation department')
            .populate('markedBy', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await StaffAttendance.countDocuments(query);

        // Get statistics
        const stats = await StaffAttendance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            count: attendance.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            stats: {
                total: stats.reduce((sum, stat) => sum + stat.count, 0),
                distribution: stats
            },
            data: attendance
        });

    } catch (error) {
        console.error('Error fetching staff attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get staff attendance stats
// @route   GET /api/staff-attendance/stats
// @access  Private/Admin
exports.getStaffAttendanceStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalStaff = await User.countDocuments({ role: 'staff' });
        const presentToday = await StaffAttendance.countDocuments({
            date: today,
            status: 'present'
        });

        const leaveToday = await StaffAttendance.countDocuments({
            date: today,
            status: 'leave'
        });

        res.json({
            success: true,
            data: {
                today: presentToday,
                totalStaff,
                leaveToday,
                percentage: totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching staff attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get today's staff summary
// @route   GET /api/staff-attendance/today/summary
// @access  Private/Admin
exports.getTodayStaffSummary = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const tomorrow = new Date(targetDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all staff users
        const staffUsers = await User.find({ role: 'staff' })
            .select('name email phone')
            .lean();

        // Get their profiles
        const staffProfiles = await Staff.find({ user: { $in: staffUsers.map(u => u._id) } })
            .select('employeeId designation department user')
            .lean();

        // Create a map for quick lookup
        const profileMap = {};
        staffProfiles.forEach(p => {
            profileMap[p.user.toString()] = p;
        });

        // Get today's attendance
        const todayAttendance = await StaffAttendance.find({
            date: { $gte: targetDate, $lt: tomorrow }
        }).lean();

        const attendanceMap = {};
        todayAttendance.forEach(record => {
            attendanceMap[record.staff.toString()] = record;
        });

        // Combine
        const summary = staffUsers.map(user => ({
            user,
            profile: profileMap[user._id.toString()] || null,
            attendance: attendanceMap[user._id.toString()] || null,
            isMarked: !!attendanceMap[user._id.toString()]
        }));

        res.status(200).json({
            success: true,
            data: {
                date: targetDate,
                summary
            }
        });

    } catch (error) {
        console.error('Error fetching staff today summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getStaffMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Get all staff users first to ensure we include those with no attendance
        const staffUsers = await User.find({ role: 'staff' }).select('name email');
        
        const attendanceRecords = await StaffAttendance.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate('staff', 'name');

        const reports = staffUsers.map(user => {
            const userRecords = attendanceRecords.filter(r => r.staff._id.toString() === user._id.toString());
            const stats = {
                present: userRecords.filter(r => r.status === 'present').length,
                absent: userRecords.filter(r => r.status === 'absent').length,
                late: userRecords.filter(r => r.status === 'late').length,
                leave: userRecords.filter(r => r.status === 'leave').length,
                halfDay: userRecords.filter(r => r.status === 'half_day').length,
                total: userRecords.length
            };

            const totalDays = new Date(year, month, 0).getDate();
            stats.percentage = stats.total > 0 ? ((stats.present + stats.halfDay * 0.5) / stats.total * 100).toFixed(1) : 0;

            return {
                staff: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                attendance: stats
            };
        });

        res.status(200).json({
            success: true,
            data: {
                month,
                year,
                reports,
                overall: {
                    totalStaff: staffUsers.length,
                    averagePercentage: reports.length > 0 ? 
                        reports.reduce((acc, r) => acc + parseFloat(r.attendance.percentage), 0) / reports.length : 0
                }
            }
        });
    } catch (error) {
        console.error('Error generating staff monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get staff attendance by ID
// @route   GET /api/staff-attendance/:id
// @access  Private/Admin
exports.getStaffAttendanceById = async (req, res) => {
    try {
        const attendance = await StaffAttendance.findById(req.params.id)
            .populate('staff', 'name email phone')
            .populate('staffProfile', 'employeeId designation department')
            .populate('markedBy', 'name')
            .populate('verifiedBy', 'name email');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Staff attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        console.error('Error getting staff attendance by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update staff attendance record
// @route   PUT /api/staff-attendance/:id
// @access  Private/Admin
exports.updateStaffAttendance = async (req, res) => {
    try {
        const existingAttendance = await StaffAttendance.findById(req.params.id);
        if (!existingAttendance) {
            return res.status(404).json({
                success: false,
                message: 'Staff attendance record not found'
            });
        }

        const updateData = { ...req.body };
        // If status is present and check-in time isn't set, set it to now
        if (updateData.status === 'present' && !updateData.checkInTime && !existingAttendance.checkInTime) {
            updateData.checkInTime = new Date();
        }

        const attendance = await StaffAttendance.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('staff', 'name');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Staff attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff attendance updated successfully',
            data: attendance
        });
    } catch (error) {
        console.error('Error updating staff attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
// @desc    Verify staff attendance record
// @route   PUT /api/staff-attendance/:id/verify
// @access  Private/Admin
exports.verifyStaffAttendance = async (req, res) => {
    try {
        const attendance = await StaffAttendance.findByIdAndUpdate(
            req.params.id,
            {
                verifiedBy: req.user.id,
                verificationDate: new Date()
            },
            { new: true }
        ).populate('verifiedBy', 'name');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Staff attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff attendance verified successfully',
            data: attendance
        });
    } catch (error) {
        console.error('Error verifying staff attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
// @desc    Delete staff attendance record
// @route   DELETE /api/staff-attendance/:id
// @access  Private/Admin
exports.deleteStaffAttendance = async (req, res) => {
    try {
        const attendance = await StaffAttendance.findByIdAndDelete(req.params.id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Staff attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff attendance record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
