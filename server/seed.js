// server/seedData.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Child = require('./models/Child');
const Staff = require('./models/Staff');
const DailyReport = require('./models/DailyReport');
const Attendance = require('./models/Attendance');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Child.deleteMany({}),
            Staff.deleteMany({}),
            DailyReport.deleteMany({}),
            Attendance.deleteMany({})
        ]);
        console.log('✅ Database cleared');

        // Create admin user
        console.log('👑 Creating admin user...');
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@eega.com',
            password: adminPassword,
            role: 'admin',
            phone: '9876543210',
            isActive: true
        });

        // Create staff users
        console.log('👥 Creating staff users...');
        const staffMembers = [
            {
                name: 'Priya Sharma',
                email: 'priya@eega.com',
                phone: '9876543211',
                designation: 'Senior Caretaker',
                department: 'caretaker'
            },
            {
                name: 'Raj Kumar',
                email: 'raj@eega.com',
                phone: '9876543212',
                designation: 'Teacher',
                department: 'teacher'
            },
            {
                name: 'Anita Patel',
                email: 'anita@eega.com',
                phone: '9876543213',
                designation: 'Cook',
                department: 'cook'
            }
        ];

        const createdStaff = [];
        for (const staffData of staffMembers) {
            const staffPassword = await bcrypt.hash('staff123', 10);
            const user = await User.create({
                name: staffData.name,
                email: staffData.email,
                password: staffPassword,
                role: 'staff',
                phone: staffData.phone,
                isActive: true
            });

            const employeeId = await Staff.generateEmployeeId();

            const staff = await Staff.create({
                user: user._id,
                employeeId,
                designation: staffData.designation,
                department: staffData.department,
                createdBy: admin._id
            });

            user.staffProfile = staff._id;
            await user.save();

            createdStaff.push({ user, staff });
        }

        // Create children
        console.log('👶 Creating sample children...');
        // Create children
        console.log('👶 Creating sample children...');
        const childrenData = [
            {
                name: 'Rahul Verma',
                dateOfBirth: new Date('2015-03-15'),
                gender: 'male',
                background: 'Orphaned in road accident',
                medicalHistory: 'None',
                allergies: 'Dust',
                bloodGroup: 'B+',
                assignedStaff: createdStaff[0].user._id,
                status: 'active',
                guardianInfo: {
                    name: 'Local Police Station',
                    relationship: 'guardian',
                    phone: '100'
                },
                createdBy: admin._id
            },
            {
                name: 'Sneha Patel',
                dateOfBirth: new Date('2017-07-22'),
                gender: 'female',
                background: 'Abandoned at hospital',
                medicalHistory: 'Asthma',
                allergies: 'None',
                bloodGroup: 'O+',
                assignedStaff: createdStaff[0].user._id,
                status: 'active',
                createdBy: admin._id
            },
            {
                name: 'Arun Singh',
                dateOfBirth: new Date('2013-11-30'),
                gender: 'male',
                background: 'Parents passed away in flood',
                medicalHistory: 'Malnutrition history',
                allergies: 'Milk',
                bloodGroup: 'A+',
                assignedStaff: createdStaff[1].user._id,
                status: 'active',
                createdBy: admin._id
            }
        ];

        const children = [];
        for (const data of childrenData) {
            const childId = await Child.getNextChildId();
            const child = await Child.create({ ...data, childId });
            children.push(child);
        }

        // Create daily reports for the last 7 days
        console.log('📝 Creating sample daily reports...');
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const reportDate = new Date(today);
            reportDate.setDate(reportDate.getDate() - i);

            for (const child of children) {
                await DailyReport.create({
                    child: child._id,
                    date: reportDate,
                    staff: child.assignedStaff,
                    healthStatus: {
                        overall: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)],
                        temperature: 36 + Math.random() * 1.5
                    },
                    behavior: ['excellent', 'good', 'average'][Math.floor(Math.random() * 3)],
                    specialNotes: `Daily report for ${child.name}`,
                    needsAttention: Math.random() > 0.8
                });
            }
        }

        // Create attendance records for the last 30 days
        console.log('✅ Creating sample attendance records...');
        for (let i = 0; i < 30; i++) {
            const attendanceDate = new Date(today);
            attendanceDate.setDate(attendanceDate.getDate() - i);

            for (const child of children) {
                await Attendance.create({
                    child: child._id,
                    date: attendanceDate,
                    status: ['present', 'present', 'present', 'absent', 'sick'][Math.floor(Math.random() * 5)],
                    markedBy: child.assignedStaff,
                    remarks: `Attendance for ${child.name}`
                });
            }
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('=====================');
        console.log('👑 Admin:');
        console.log('   Email: admin@eega.com');
        console.log('   Password: admin123');
        console.log('\n👥 Staff Members:');
        createdStaff.forEach((staff, index) => {
            console.log(`   ${index + 1}. ${staff.user.name}`);
            console.log(`      Email: ${staff.user.email}`);
            console.log(`      Password: staff123`);
            console.log(`      Designation: ${staff.staff.designation}`);
        });
        console.log('\n👶 Sample Children Created:');
        children.forEach(child => {
            console.log(`   - ${child.name} (ID: ${child.childId})`);
        });
        console.log('\n📊 Sample Data:');
        console.log(`   - ${children.length} Children`);
        console.log(`   - ${createdStaff.length} Staff Members`);
        console.log(`   - 7 days of Daily Reports`);
        console.log(`   - 30 days of Attendance Records`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();