const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server'); // Your Express app
const Child = require('../models/Child');
const User = require('../models/User');

let adminToken;
let staffToken;
let testChildId;

beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // Create test admin user
    const admin = await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
    });
    
    // Create test staff user
    const staff = await User.create({
        name: 'Test Staff',
        email: 'staff@test.com',
        password: 'password123',
        role: 'staff'
    });
    
    // Get tokens (you'll need to implement login endpoint)
    const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminRes.body.token;
    
    const staffRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@test.com', password: 'password123' });
    staffToken = staffRes.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe('Child Management API', () => {
    describe('POST /api/children', () => {
        it('should create a new child with valid data (admin)', async () => {
            const childData = {
                name: 'John Doe',
                dateOfBirth: '2015-06-15',
                gender: 'male',
                background: 'Test background',
                medicalHistory: 'None',
                allergies: 'None'
            };
            
            const res = await request(app)
                .post('/api/children')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(childData);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('childId');
            expect(res.body.data.name).toBe(childData.name);
            
            testChildId = res.body.data._id;
        });
        
        it('should reject child creation without admin role', async () => {
            const childData = {
                name: 'Jane Doe',
                dateOfBirth: '2016-07-20',
                gender: 'female',
                background: 'Test background'
            };
            
            const res = await request(app)
                .post('/api/children')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(childData);
            
            expect(res.statusCode).toEqual(403);
        });
    });
    
    describe('GET /api/children', () => {
        it('should get all children with authentication', async () => {
            const res = await request(app)
                .get('/api/children')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        
        it('should filter children by status', async () => {
            const res = await request(app)
                .get('/api/children?status=active')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
        });
    });
    
    describe('GET /api/children/:id', () => {
        it('should get a child by ID', async () => {
            const res = await request(app)
                .get(`/api/children/${testChildId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(testChildId);
        });
        
        it('should return 404 for non-existent child', async () => {
            const res = await request(app)
                .get('/api/children/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toEqual(404);
        });
    });
    
    describe('PUT /api/children/:id', () => {
        it('should update child information (admin)', async () => {
            const updateData = {
                name: 'John Updated',
                background: 'Updated background'
            };
            
            const res = await request(app)
                .put(`/api/children/${testChildId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe(updateData.name);
        });
    });
    
    describe('DELETE /api/children/:id', () => {
        it('should discharge a child (admin)', async () => {
            const res = await request(app)
                .delete(`/api/children/${testChildId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('discharged');
        });
    });
});