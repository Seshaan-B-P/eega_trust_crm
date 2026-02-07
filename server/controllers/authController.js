const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Simulate user creation
        const user = {
            id: 'user_' + Date.now(),
            name,
            email,
            role: 'user'
        };
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'test_secret',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Simulate authentication
        if (email === 'admin@eega.com' && password === 'admin123') {
            const user = {
                id: 'admin_001',
                name: 'Admin User',
                email: 'admin@eega.com',
                role: 'admin'
            };
            
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'test_secret',
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                message: 'Login successful',
                token,
                user
            });
        }
        
        if (email === 'staff@eega.com' && password === 'staff123') {
            const user = {
                id: 'staff_001',
                name: 'Staff User',
                email: 'staff@eega.com',
                role: 'staff'
            };
            
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'test_secret',
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                message: 'Login successful',
                token,
                user
            });
        }
        
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};