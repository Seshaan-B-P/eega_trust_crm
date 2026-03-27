const mongoose = require('mongoose');
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Child = require('../models/Child');
const Elderly = require('../models/Elderly');
const DailyReport = require('../models/DailyReport');

let adminToken;
let staffToken;
let adminId;
let staffId;
let testChildId;
let testElderlyId;

beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eega_trust_test');
    }

    // Clean up test users
    await User.deleteMany({ email: { $in: ['admin_test@eega.com', 'staff_test@eega.com'] } });

    // Create test admin
    const admin = await User.create({
        name: 'Admin Test',
        email: 'admin_test@eega.com',
        password: 'password123',
        role: 'admin'
    });
    adminId = admin._id;

    // Create test staff
    const staff = await User.create({
        name: 'Staff Test',
        email: 'staff_test@eega.com',
        password: 'password123',
        role: 'staff'
    });
    staffId = staff._id;

    // Get tokens
    const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin_test@eega.com', password: 'password123' });
    adminToken = adminRes.body.token;

    const staffRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff_test@eega.com', password: 'password123' });
    staffToken = staffRes.body.token;
});

afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: { $in: ['admin_test@eega.com', 'staff_test@eega.com'] } });
    await Child.deleteMany({ name: 'Integration Test Child' });
    await Elderly.deleteMany({ name: 'Integration Test Elderly' });
    await DailyReport.deleteMany({ specialNotes: 'Integration Test Note' });
    await mongoose.connection.close();
});

describe('Full Project Integration Workflow', () => {
    
    test('1. Child Lifecycle: Create -> Fetch -> Update', async () => {
        // Create
        const createRes = await request(app)
            .post('/api/children')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Integration Test Child',
                dateOfBirth: '2015-01-01',
                gender: 'male',
                background: 'Test background',
                medicalHistory: 'None'
            });
        
        expect(createRes.status).toBe(201);
        testChildId = createRes.body.data._id;

        // Fetch
        const fetchRes = await request(app)
            .get(`/api/children/${testChildId}`)
            .set('Authorization', `Bearer ${staffToken}`);
        
        expect(fetchRes.status).toBe(200);
        expect(fetchRes.body.data.name).toBe('Integration Test Child');

        // Update
        const updateRes = await request(app)
            .put(`/api/children/${testChildId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ background: 'Updated background' });
        
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.background).toBe('Updated background');
    });

    test('2. Elderly Lifecycle: Create -> Fetch -> Activity Log', async () => {
        // Create
        const createRes = await request(app)
            .post('/api/elderly')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Integration Test Elderly',
                age: 70,
                gender: 'Female',
                dateOfBirth: '1954-01-01',
                specialNeeds: 'None',
                assignedStaff: staffId
            });
        
        expect(createRes.status).toBe(201);
        testElderlyId = createRes.body.data._id;

        // Add Activity Log
        const logRes = await request(app)
            .post(`/api/elderly/${testElderlyId}/activities`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                activityType: 'Health Check',
                description: 'Routine checkup',
                staffNotes: 'No issues'
            });
        
        expect(logRes.status).toBe(201);
    });

    test('3. Daily Report Workflow', async () => {
        const reportRes = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                child: testChildId,
                date: new Date(),
                healthStatus: {
                    overall: 'good',
                    temperature: 36.6
                },
                behavior: 'good',
                specialNotes: 'Integration Test Note'
            });
        
        expect(reportRes.status).toBe(201);
    });

    test('4. Dashboard Statistics Verification', async () => {
        const statsRes = await request(app)
            .get('/api/reports/stats/overview')
            .set('Authorization', `Bearer ${staffToken}`);
        
        expect(statsRes.status).toBe(200);
        expect(statsRes.body.success).toBe(true);
        expect(statsRes.body.data).toHaveProperty('todayReports');
    });
});
