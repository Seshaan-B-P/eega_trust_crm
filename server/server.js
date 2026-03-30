// server.js - Complete EEGA Trust CRM Server
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');


const app = express();

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'uploads/receipts')));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// ========== DATABASE CONNECTION ==========
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/eega_trust_crm',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('CRITICAL: Database connection failed. Persistent mode required.');
        process.exit(1); // Fail-fast for persistence
    }
};

// ========== BASIC ROUTES ==========
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🎉 EEGA Trust CRM API',
        version: '1.2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        documentation: 'http://localhost:' + (process.env.PORT || 5000) + '/api/docs',
        endpoints: {
            auth: '/api/auth',
            children: '/api/children',
            staff: '/api/staff',
            reports: '/api/reports',
            attendance: '/api/attendance',
            staffAttendance: '/api/staff-attendance',
            expenses: '/api/expenses',
            inventory: '/api/inventory',
            health: '/health',
            docs: '/api/docs'
        }
    });
});

app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMessages = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.json({
        status: 'healthy',
        server: 'EEGA Trust CRM',
        timestamp: new Date().toISOString(),
        database: statusMessages[dbStatus] || 'unknown',
        uptime: process.uptime().toFixed(2) + ' seconds'
    });
});

// ========== API DOCUMENTATION ==========
app.get('/api/docs', (req, res) => {
    try {
        const templatePath = path.join(__dirname, 'templates/docs.hbs');
        const source = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(source);

        const apiData = {
            title: 'EEGA Trust CRM API',
            version: '1.2.0',
            baseURL: `${req.protocol}://${req.get('host')}`,
            timestamp: new Date().toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            }),
            authentication: 'Bearer JWT Token in Authorization header',
            totalEndpoints: 85,
            moduleCount: 14,
            modules: [
                {
                    name: 'Authentication',
                    endpoints: [
                        { method: 'POST', path: '/api/auth/register', description: 'Register a new user' },
                        { method: 'POST', path: '/api/auth/login', description: 'User login', body: '{"email": "admin@eega.com", "password": "admin123"}' },
                        { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset' },
                        { method: 'GET', path: '/api/auth/profile', auth: true, description: 'Get current user profile' },
                        { method: 'PUT', path: '/api/auth/profile', auth: true, description: 'Update user profile' },
                        { method: 'PUT', path: '/api/auth/change-password', auth: true, description: 'Change password' },
                        { method: 'POST', path: '/api/auth/profile/photo', auth: true, description: 'Upload profile photo (multipart/form-data)' },
                        { method: 'DELETE', path: '/api/auth/profile/photo', auth: true, description: 'Delete profile photo' }
                    ]
                },
                {
                    name: 'Children Management',
                    endpoints: [
                        { method: 'GET', path: '/api/children', auth: true, description: 'List all children with filtering & pagination' },
                        { method: 'POST', path: '/api/children', auth: true, role: 'staff, admin', description: 'Register a new child' },
                        { method: 'GET', path: '/api/children/:id', auth: true, description: 'Get child details by ID or childId' },
                        { method: 'PUT', path: '/api/children/:id', auth: true, role: 'admin', description: 'Update child information' },
                        { method: 'DELETE', path: '/api/children/:id', auth: true, role: 'admin', description: 'Delete child record (cascade delete)' },
                        { method: 'GET', path: '/api/children/stats/overview', auth: true, description: 'Get children statistics' },
                        { method: 'POST', path: '/api/children/:id/photo', auth: true, description: 'Upload child photo' }
                    ]
                },
                {
                    name: 'Elderly Residents',
                    endpoints: [
                        { method: 'GET', path: '/api/elderly', auth: true, description: 'List all elderly residents' },
                        { method: 'POST', path: '/api/elderly', auth: true, description: 'Add new elderly resident' },
                        { method: 'GET', path: '/api/elderly/:id', auth: true, description: 'Get resident details' },
                        { method: 'PUT', path: '/api/elderly/:id', auth: true, description: 'Update resident info' },
                        { method: 'DELETE', path: '/api/elderly/:id', auth: true, role: 'admin', description: 'Remove resident' },
                        { method: 'POST', path: '/api/elderly/:id/activities', auth: true, description: 'Add activity log' },
                        { method: 'GET', path: '/api/elderly/stats', auth: true, description: 'Get elderly statistics' }
                    ]
                },
                {
                    name: 'Staff Management',
                    endpoints: [
                        { method: 'GET', path: '/api/staff', auth: true, role: 'admin', description: 'List all staff members' },
                        { method: 'POST', path: '/api/staff', auth: true, role: 'admin', description: 'Create staff account' },
                        { method: 'GET', path: '/api/staff/available', auth: true, description: 'Get staff available for assignment' },
                        { method: 'GET', path: '/api/staff/:id', auth: true, role: 'admin', description: 'Get staff details' },
                        { method: 'PUT', path: '/api/staff/:id', auth: true, role: 'admin', description: 'Update staff record' },
                        { method: 'DELETE', path: '/api/staff/:id', auth: true, role: 'admin', description: 'Remove staff' }
                    ]
                },
                {
                    name: 'Daily Reports',
                    endpoints: [
                        { method: 'GET', path: '/api/reports', auth: true, description: 'List all daily reports' },
                        { method: 'POST', path: '/api/reports', auth: true, description: 'Create new daily report' },
                        { method: 'GET', path: '/api/reports/:id', auth: true, description: 'Get report details' },
                        { method: 'GET', path: '/api/reports/resident/:type/:residentId', auth: true, description: 'Get reports for specific resident' },
                        { method: 'GET', path: '/api/reports/attention/needed', auth: true, role: 'admin', description: 'Get reports flagged for attention' },
                        { method: 'PUT', path: '/api/reports/:id/resolve', auth: true, role: 'admin', description: 'Mark report as resolved' }
                    ]
                },
                {
                    name: 'Attendance',
                    endpoints: [
                        { method: 'GET', path: '/api/attendance', auth: true, description: 'List attendance records' },
                        { method: 'POST', path: '/api/attendance', auth: true, description: 'Mark single attendance' },
                        { method: 'POST', path: '/api/attendance/bulk', auth: true, description: 'Mark bulk attendance' },
                        { method: 'GET', path: '/api/attendance/today/summary', auth: true, description: 'Get today\'s attendance summary' },
                        { method: 'GET', path: '/api/attendance/stats', auth: true, description: 'Get attendance statistics' }
                    ]
                },
                {
                    name: 'Donations & Finance',
                    endpoints: [
                        { method: 'GET', path: '/api/donations', auth: true, description: 'List all donations' },
                        { method: 'POST', path: '/api/donations', auth: true, description: 'Log new donation' },
                        { method: 'PUT', path: '/api/donations/:id/verify', auth: true, role: 'admin', description: 'Verify donation record' },
                        { method: 'POST', path: '/api/donations/:id/generate-receipt', auth: true, role: 'admin', description: 'Generate PDF receipt' },
                        { method: 'GET', path: '/api/expenses', auth: true, role: 'admin', description: 'List all expenses' },
                        { method: 'POST', path: '/api/expenses', auth: true, role: 'admin', description: 'Log new expense' },
                        { method: 'GET', path: '/api/donations/stats', auth: true, description: 'Get donation statistics' }
                    ]
                },
                {
                    name: 'Inventory System',
                    endpoints: [
                        { method: 'GET', path: '/api/inventory', auth: true, description: 'List inventory items' },
                        { method: 'POST', path: '/api/inventory', auth: true, role: 'staff, admin', description: 'Add new item' },
                        { method: 'PATCH', path: '/api/inventory/:id/stock', auth: true, description: 'Update stock levels' },
                        { method: 'GET', path: '/api/inventory/stats/summary', auth: true, description: 'Inventory health summary' }
                    ]
                },
                {
                    name: 'Analytics',
                    endpoints: [
                        { method: 'GET', path: '/api/analytics/dashboard', auth: true, role: 'staff, admin', description: 'Full system analytics' },
                        { method: 'GET', path: '/api/analytics/predictive', auth: true, role: 'admin', description: 'Resource forecasting' },
                        { method: 'GET', path: '/api/analytics/export', auth: true, role: 'admin', description: 'Export raw data' }
                    ]
                },
                {
                    name: 'Internal Services',
                    endpoints: [
                        { method: 'GET', path: '/api/notifications', auth: true, description: 'Get user notifications' },
                        { method: 'PATCH', path: '/api/notifications/:id/read', auth: true, description: 'Mark notification as read' },
                        { method: 'GET', path: '/api/search', auth: true, description: 'Global cross-module search' },
                        { method: 'GET', path: '/health', description: 'Server health check' },
                        { method: 'GET', path: '/api/health/stats/distribution', auth: true, description: 'Resident health distribution stats' }
                    ]
                }
            ]
        };

        const html = template(apiData);
        res.send(html);
    } catch (error) {
        console.error('Error rendering documentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating documentation'
        });
    }
});



// ========== API ROUTES ==========
// We'll add these routes one by one
const setupRoutes = async () => {
    console.log('Loading API routes...');

    const routes = [
        { path: '/api/auth', file: './routes/auth', name: 'Auth' },
        { path: '/api/elderly', file: './routes/elderlyRoutes', name: 'Elderly' },
        { path: '/api/children', file: './routes/child', name: 'Child' },
        { path: '/api/staff', file: './routes/staff', name: 'Staff' },
        { path: '/api/reports', file: './routes/dailyReport', name: 'Report' },
        { path: '/api/attendance', file: './routes/attendance', name: 'Attendance' },
        { path: '/api/staff-attendance', file: './routes/staffAttendance', name: 'Staff Attendance' },
        { path: '/api/donations', file: './routes/donation', name: 'Donation' },
        { path: '/api/expenses', file: './routes/expense', name: 'Expense' },
        { path: '/api/analytics', file: './routes/analytics', name: 'Analytics' },
        { path: '/api/inventory', file: './routes/inventoryRoutes', name: 'Inventory' },
        { path: '/api/notifications', file: './routes/notification', name: 'Notification' },
        { path: '/api/search', file: './routes/search', name: 'Search' },
        { path: '/api/health', file: './routes/health', name: 'Health' }
    ];

    for (const route of routes) {
        try {
            console.log(`Loading ${route.name} routes...`);
            const routeModule = require(route.file);
            app.use(route.path, routeModule);
            console.log(`✅ ${route.name} routes loaded`);
        } catch (error) {
            console.error(`❌ Error loading ${route.name} routes:`, error.message);
        }
    }

    console.log('✅ API routes initialization complete');
};

// ========== ERROR HANDLING ==========
const setupErrorHandling = () => {
    // 404 Handler
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            message: '🔍 Route not found',
            requestedUrl: req.originalUrl,
            availableEndpoints: [
                'GET /health',
                'GET /api/docs',
                'POST /api/auth/login',
                'GET /api/children',
                'GET /api/donations/stats',
                'GET /api/expenses/stats',
                'GET /api/attendance/stats'
            ]
        });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        console.error('❌ Server Error:', err.stack);

        res.status(err.status || 500).json({
            success: false,
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
            timestamp: new Date().toISOString()
        });
    });
};

// ========== SERVER STARTUP ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    console.log('🚀 Starting EEGA Trust CRM Server...');
    console.log('====================================');

    // Connect to database
    await connectDB();

    // Setup routes
    await setupRoutes();

    // Setup error handling (MUST be last)
    setupErrorHandling();

    // Start server
    const server = app.listen(PORT, () => {
        console.log(`
🎉 SERVER STARTED SUCCESSFULLY!
====================================
🚀 Port: ${PORT}
🌐 URL: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
📚 Docs: http://localhost:${PORT}/api/docs

📋 AVAILABLE ENDPOINTS:
   🔗 Home:      http://localhost:${PORT}
   📊 Health:    http://localhost:${PORT}/health
   📚 API Docs:  http://localhost:${PORT}/api/docs
   🔐 Auth:      http://localhost:${PORT}/api/auth
   👶 Children:  http://localhost:${PORT}/api/children

🔑 TEST CREDENTIALS:
   👑 Admin:  admin@eega.com / admin123
   👤 Staff:  staff@eega.com / staff123

💡 TIPS:
   • Use Postman or curl to test endpoints
   • Check /api/docs for API documentation
   • All data is persistent in MongoDB
====================================
        `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });

    return server;
};

// Start the server
if (require.main === module) {
    startServer().catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = { app, startServer };