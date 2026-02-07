// server-simple.js - Minimal working Express server
require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'EEGA Trust CRM API is working!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: 'EEGA Trust CRM',
        timestamp: new Date().toISOString()
    });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'API endpoint is working',
            endpoints: ['/', '/health', '/api/test']
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`
🎉 EEGA Trust CRM Server Started!
🚀 Port: ${PORT}
🌐 URL: http://localhost:${PORT}

📋 Test Endpoints:
   🔗 Home:      http://localhost:${PORT}
   📊 Health:    http://localhost:${PORT}/health
   🧪 API Test:  http://localhost:${PORT}/api/test
    `);
});