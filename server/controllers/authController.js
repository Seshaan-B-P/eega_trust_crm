const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { createNotification } = require('../utils/notificationHelper');

// Helper to generate token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '30d' }
    );
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Notify Admin
        await createNotification({
            title: 'Password Change Request',
            message: `Staff member ${user.name} (${user.email}) has requested a password change. Please contact them or update their password in Staff Management.`,
            type: 'staff',
            data: { userId: user._id, email: user.email },
            recipientRole: 'admin'
        });

        res.json({
            success: true,
            message: 'Your request has been sent to the Admin. Please contact them for your new password.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, department, phone } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'staff',
            department,
            phone
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                notificationSettings: user.notificationSettings
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`Login Request: Email="${email}" (len=${email.length}), Password (len=${password.length})`);

        // Trim input to avoid copy-paste errors
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        // Check for user
        const user = await User.findOne({ email: cleanEmail }).select('+password');
        if (!user) {
            console.log('User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        console.log(`Login attempt for ${cleanEmail}`);
        const isMatch = await user.comparePassword(cleanPassword);
        console.log(`Password match result for ${email}: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                notificationSettings: user.notificationSettings
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                notificationSettings: user.notificationSettings,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.phone) user.phone = req.body.phone;
        if (req.body.address) user.address = req.body.address;
        if (req.body.notificationSettings) {
            user.notificationSettings = {
                ...user.notificationSettings,
                ...req.body.notificationSettings
            };
        }

        if (req.body.password) {
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only admins can change passwords'
                });
            }
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                department: updatedUser.department,
                notificationSettings: updatedUser.notificationSettings,
                phone: updatedUser.phone,
                address: updatedUser.address,
                profileImage: updatedUser.profileImage
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update profile photo
// @route   POST /api/auth/profile/photo
// @access  Private
exports.updateProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Construct URL
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        user.profileImage = photoUrl;
        await user.save();

        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            profileImage: photoUrl,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: photoUrl,
                notificationSettings: user.notificationSettings
            }
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading photo',
            error: error.message
        });
    }
};
// @desc    Delete profile photo
// @route   DELETE /api/auth/profile/photo
// @access  Private
exports.deleteProfilePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.profileImage = null;
        await user.save();

        res.json({
            success: true,
            message: 'Profile photo removed successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: null,
                notificationSettings: user.notificationSettings
            }
        });
    } catch (error) {
        console.error('Photo delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing photo',
            error: error.message
        });
    }
};
