const Staff = require('../models/Staff');
const User = require('../models/User');
// Add to staffController.js
const emailService = require('../services/emailService');

// Update createStaff function
exports.createStaff = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { userData, staffData } = req.body;

            // Generate plain password for email
            const plainPassword = userData.password;

            // 1. Create user account
            const user = new User({
                ...userData,
                role: 'staff',
                isActive: true
            });
            await user.save({ session });

            // 2. Create staff profile
            const staff = new Staff({
                ...staffData,
                user: user._id,
                createdBy: req.user.id
            });
            await staff.save({ session });

            // 3. Link staff profile to user
            user.staffProfile = staff._id;
            await user.save({ session });

            await session.commitTransaction();
            session.endSession();

            // Send welcome email
            try {
                await emailService.sendWelcomeEmail(user, plainPassword);
            } catch (emailError) {
                console.error('Welcome email failed:', emailError);
                // Don't fail the request if email fails
            }

            const populatedStaff = await Staff.findById(staff._id)
                .populate('user', 'name email phone');

            res.status(201).json({
                success: true,
                message: 'Staff member created successfully',
                data: populatedStaff
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        // ... error handling
    }
};
// @desc    Get staff statistics
// @route   GET /api/staff/stats/overview
// @access  Protected
exports.getStaffStats = async (req, res) => {
    try {
        const stats = {
            total: await Staff.countDocuments(),
            active: await Staff.countDocuments({ status: 'active' }),
            onLeave: await Staff.countDocuments({ status: 'on_leave' }),
            departments: {
                caretaker: await Staff.countDocuments({ department: 'caretaker' }),
                medical: await Staff.countDocuments({ department: 'medical' }),
                admin: await Staff.countDocuments({ department: 'admin' }),
                kitchen: await Staff.countDocuments({ department: 'kitchen' })
            }
        };

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
        const staff = await Staff.find()
            .populate('user', 'name email phone role isActive profileImage')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: staff.length,
            data: staff
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

// @desc    Create new staff
// @route   POST /api/staff
// @access  Admin
exports.createStaff = async (req, res) => {
    try {
        const { name, email, password, phone, designation, department, salary, shift, joinDate, address } = req.body;

        // Validation
        if (!name || !email || !designation) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and designation are required'
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create User first
        user = await User.create({
            name,
            email,
            password,
            role: 'staff',
            phone,
            address
        });

        // Generate Employee ID
        const employeeId = await Staff.generateEmployeeId();

        // Create Staff profile
        const staff = await Staff.create({
            user: user._id,
            employeeId,
            designation,
            department,
            salary,
            shift,
            joinDate,
            createdBy: req.user.id
        });

        // Link staff profile to user
        user.staffProfile = staff._id;
        await user.save();

        res.status(201).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Admin
exports.updateStaff = async (req, res) => {
    try {
        let staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        const { designation, department, salary, shift, status, maxChildrenCapacity } = req.body;

        // Update fields
        if (designation) staff.designation = designation;
        if (department) staff.department = department;
        if (salary) staff.salary = salary;
        if (shift) staff.shift = shift;
        if (status) staff.status = status;
        if (maxChildrenCapacity) staff.maxChildrenCapacity = maxChildrenCapacity;

        await staff.save();

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Deactivate staff
// @route   DELETE /api/staff/:id
// @access  Admin
exports.deactivateStaff = async (req, res) => {
    try {
        // Find staff
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        // Deactivate user account
        const user = await User.findById(staff.user);
        if (user) {
            user.isActive = false;
            await user.save();
        }

        // Update staff status
        staff.status = 'inactive';
        await staff.save();

        res.json({
            success: true,
            message: 'Staff deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};