const Staff = require('../models/Staff');
const User = require('../models/User');
const mongoose = require('mongoose');
const emailService = require('../services/emailService');

// @desc    Create new staff
// @route   POST /api/staff
// @access  Admin
exports.createStaff = async (req, res) => {
    try {
        const {
            name, email, password, phone, designation, department,
            salary, shift, joinDate, address, qualification,
            experience, maxChildrenCapacity, emergencyContact
        } = req.body;

        // Validation
        if (!name || !email || !designation) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and designation are required'
            });
        }

        // Check if user exists
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // 1. Create User account
        const user = new User({
            name,
            email,
            password,
            role: 'staff',
            phone,
            address,
            isActive: true
        });
        await user.save();

        // 2. Generate Employee ID
        const employeeId = await Staff.generateEmployeeId();

        // 3. Create Staff profile
        const staff = new Staff({
            user: user._id,
            employeeId,
            designation,
            department,
            salary,
            shift,
            joinDate: joinDate || new Date(),
            qualification,
            experience,
            maxChildrenCapacity: maxChildrenCapacity || 10,
            emergencyContact,
            createdBy: req.user.id
        });
        await staff.save();

        // 4. Link staff profile to user
        user.staffProfile = staff._id;
        await user.save();

        // Send welcome email (async, don't block response)
        emailService.sendWelcomeEmail(user, password).catch(err => {
            console.error('Welcome email failed:', err);
        });

        const populatedStaff = await Staff.findById(staff._id)
            .populate('user', 'name email phone role isActive');

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: populatedStaff
        });

    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
// @desc    Get staff statistics
// @route   GET /api/staff/stats/overview
// @access  Protected
exports.getStaffStats = async (req, res) => {
    try {
        const stats = {
            total: await Staff.countDocuments(),
            active: await Staff.countDocuments({ isActive: true }),
            inactive: await Staff.countDocuments({ isActive: false }),
            departments: {}
        };

        const depts = ['caretaker', 'teacher', 'cook', 'doctor', 'administrator', 'security', 'other'];
        for (const dept of depts) {
            stats.departments[dept] = await Staff.countDocuments({ department: dept });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting staff stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all staff
// @route   GET /api/staff
// @access  Admin
exports.getAllStaff = async (req, res) => {
    try {
        const { search, department, isActive, page = 1, limit = 10 } = req.query;
        let query = {};

        // Filters
        if (department) query.department = department;
        if (isActive === 'true') query.isActive = true;
        if (isActive === 'false') query.isActive = false;

        // Populate and search logic
        const staffList = await Staff.find(query)
            .populate({
                path: 'user',
                match: search ? { name: { $regex: search, $options: 'i' } } : {},
                select: 'name email phone role isActive profileImage'
            })
            .sort({ createdAt: -1 });

        // If searching by name, filter out staff where user populate returned null
        let filteredStaff = staffList.filter(s => s.user);

        // Manual Pagination after filtering by user name (if searching)
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const total = filteredStaff.length;
        const totalPages = Math.ceil(total / limitNum);
        const pagedData = filteredStaff.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        // Get global stats for cards
        const stats = {
            total: await Staff.countDocuments(),
            active: await Staff.countDocuments({ isActive: true }),
            inactive: await Staff.countDocuments({ isActive: false })
        };

        res.json({
            success: true,
            count: pagedData.length,
            total,
            page: pageNum,
            totalPages,
            stats,
            data: pagedData
        });
    } catch (error) {
        console.error('Error getting all staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get available staff (for assignment)
// @route   GET /api/staff/available
// @access  Public/Protected
exports.getAvailableStaff = async (req, res) => {
    try {
        // Find staff members with role 'staff' who are active
        // First find users with role 'staff'
        const startUsers = await User.find({ role: 'staff', isActive: true });
        const userIds = startUsers.map(user => user._id);

        const staff = await Staff.find({ user: { $in: userIds } })
            .populate('user', 'name email phone profileImage')
            .sort('employeeId');

        res.json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error('Error getting available staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get staff by ID
// @route   GET /api/staff/:id
// @access  Admin
exports.getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id)
            .populate('user', '-password')
            .populate('assignedChildren');

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error getting staff by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Admin
exports.updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        const {
            name, email, password, phone, address, isActive,
            designation, department, salary, shift, status,
            maxChildrenCapacity, qualification, experience,
            workingDays, emergencyContact
        } = req.body;

        // 1. Update User Details if provided
        if (staff.user) {
            const user = await User.findById(staff.user);
            if (user) {
                if (name) user.name = name;
                if (email) user.email = email;
                if (phone) user.phone = phone;
                if (address) user.address = address;
                if (password) {
                    user.password = password;
                    console.log(`Setting new password for user ${user.email}`);
                }
                if (typeof isActive !== 'undefined') user.isActive = isActive;
                await user.save();
            }
        }

        // 2. Update Staff profile fields
        if (designation) staff.designation = designation;
        if (department) staff.department = department;
        if (salary || salary === 0) staff.salary = salary;
        if (shift) staff.shift = shift;
        if (status) staff.status = status;
        if (maxChildrenCapacity) staff.maxChildrenCapacity = maxChildrenCapacity;
        if (qualification) staff.qualification = qualification;
        if (typeof experience !== 'undefined') staff.experience = experience;
        if (workingDays) staff.workingDays = workingDays;
        if (emergencyContact) staff.emergencyContact = emergencyContact;

        await staff.save();

        const updatedStaff = await Staff.findById(staff._id).populate('user', '-password');

        res.json({
            success: true,
            message: 'Staff updated successfully',
            data: updatedStaff
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Delete staff (Hard Delete)
// @route   DELETE /api/staff/:id
// @access  Admin
exports.deleteStaff = async (req, res) => {
    try {
        // Find staff
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        // Delete user account
        if (staff.user) {
            await User.findByIdAndDelete(staff.user);
        }

        // Delete staff profile
        await Staff.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Staff and associated user account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};