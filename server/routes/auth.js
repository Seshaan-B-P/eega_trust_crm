// routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Mock user database (in memory)
const users = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@eega.com',
        password: 'admin123', // In real app, this would be hashed
        role: 'admin',
        phone: '9876543210',
        isActive: true
    },
    {
        id: '2',
        name: 'Staff User',
        email: 'staff@eega.com',
        password: 'staff123', // In real app, this would be hashed
        role: 'staff',
        phone: '9876543211',
        isActive: true
    }
];

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth route is working',
        endpoints: ['/test', '/login', '/register', '/profile']
    });
});

// Login endpoint
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        // Create token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Register endpoint (for testing)
router.post('/register', (req, res) => {
    try {
        const { name, email, password, role = 'staff', phone } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }
        
        // Check if user exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Create new user
        const newUser = {
            id: (users.length + 1).toString(),
            name,
            email,
            password, // In real app, hash this
            role: role === 'admin' ? 'admin' : 'staff',
            phone: phone || '',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Create token
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const userResponse = { ...newUser };
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Get user profile
router.get('/profile', (req, res) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Find user
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.json({
            success: true,
            user: userResponse
        });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all users (admin only - for testing)
router.get('/users', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        // Return users without passwords
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        
        res.json({
            success: true,
            count: safeUsers.length,
            users: safeUsers
        });
        
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

module.exports = router;