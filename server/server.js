// server.js - Complete EEGA Trust CRM Server
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
        console.log('⚠️  Running in memory-only mode (data will not persist)');
        return null;
    }
};

// ========== BASIC ROUTES ==========
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🎉 EEGA Trust CRM API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        endpoints: {
            auth: '/api/auth',
            children: '/api/children',
            staff: '/api/staff',
            reports: '/api/reports',
            attendance: '/api/attendance',
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
    res.json({
        title: 'EEGA Trust CRM API Documentation',
        version: '1.0.0',
        baseURL: 'http://localhost:' + (process.env.PORT || 5000),
        authentication: 'Bearer Token required for all endpoints except /api/auth/login',

        endpoints: [
            {
                method: 'POST',
                path: '/api/auth/login',
                description: 'User login',
                body: '{ email: "admin@eega.com", password: "admin123" }'
            },
            {
                method: 'GET',
                path: '/api/children',
                description: 'Get all children',
                auth: true
            },
            {
                method: 'POST',
                path: '/api/children',
                description: 'Create new child',
                auth: true,
                role: 'admin'
            },
            {
                method: 'GET',
                path: '/api/staff',
                description: 'Get all staff',
                auth: true,
                role: 'admin'
            },
            {
                method: 'POST',
                path: '/api/reports',
                description: 'Create daily report',
                auth: true
            },
            {
                method: 'POST',
                path: '/api/attendance',
                description: 'Mark attendance',
                auth: true
            }
        ],

        testCredentials: {
            admin: { email: 'admin@eega.com', password: 'admin123' },
            staff: { email: 'staff@eega.com', password: 'staff123' }
        }
    });
});

// ========== API ROUTES ==========
// We'll add these routes one by one
const setupRoutes = async () => {
    try {
        console.log('Loading routes...');

        console.log('Loading Auth routes...');
        const authRoutes = require('./routes/auth');
        app.use('/api/auth', authRoutes);

        console.log('Loading Child routes...');
        const childRoutes = require('./routes/child');
        app.use('/api/children', childRoutes);

        console.log('Loading Staff routes...');
        const staffRoutes = require('./routes/staff');
        app.use('/api/staff', staffRoutes);

        console.log('Loading Report routes...');
        const dailyReportRoutes = require('./routes/dailyReport');
        app.use('/api/reports', dailyReportRoutes);

        console.log('Loading Attendance routes...');
        const attendanceRoutes = require('./routes/attendance');
        app.use('/api/attendance', attendanceRoutes);

        console.log('✅ Routes loaded successfully');
    } catch (error) {
        console.error('❌ Error loading routes:', error);
        console.log('⚠️  Running with basic routes only');
    }
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
                'GET /',
                'GET /health',
                'GET /api/docs',
                'POST /api/auth/login',
                'GET /api/children'
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
   • All data is currently stored in memory
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