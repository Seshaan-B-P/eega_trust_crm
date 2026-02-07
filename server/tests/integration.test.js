// server/tests/integration.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Child = require('../models/Child');
const Staff = require('../models/Staff');
const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');

describe('EEGA Trust CRM Integration Tests', () => {
    let adminToken;
    let staffToken;
    let adminId;
    let staffId;
    let childId;
    let staffProfileId;
    
    beforeAll(async () => {
        // Setup test database
        // ... setup code ...
    });
    
    afterAll(async () => {
        // Cleanup
        // ... cleanup code ...
    });
    
    describe('Complete Workflow Test', () => {
        it('should complete child registration to daily reporting workflow', async () => {
            // 1. Create a child
            const childRes = await request(app)
                .post('/api/children')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Integration Test Child',
                    dateOfBirth: '2016-03-15',
                    gender: 'female',
                    background: 'Integration test background',
                    medicalHistory: 'None',
                    assignedStaff: staffId
                });
            
            expect(childRes.status).toBe(201);
            childId = childRes.body.data._id;
            
            // 2. Create daily report
            const reportRes = await request(app)
                .post('/api/reports')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({
                    child: childId,
                    date: new Date().toISOString(),
                    healthStatus: {
                        overall: 'good',
                        temperature: 36.5
                    },
                    behavior: 'good',
                    specialNotes: 'Integration test report'
                });
            
            expect(reportRes.status).toBe(201);
            
            // 3. Mark attendance
            const attendanceRes = await request(app)
                .post('/api/attendance')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({
                    child: childId,
                    date: new Date().toISOString(),
                    status: 'present',
                    remarks: 'Integration test attendance'
                });
            
            expect(attendanceRes.status).toBe(201);
            
            // 4. Verify workflow by fetching combined data
            const childDetails = await request(app)
                .get(`/api/children/${childId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(childDetails.status).toBe(200);
            expect(childDetails.body.data).toHaveProperty('recentReports');
            expect(childDetails.body.data).toHaveProperty('attendanceStats');
        });
    });
});