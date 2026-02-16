const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eega_crm');
        console.log('MongoDB Connected');

        const adminEmail = 'admin@eega.com';
        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
            // Update password just in case
            userExists.password = 'admin123';
            await userExists.save();
            console.log('Admin password reset to: admin123');
        } else {
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: 'admin123',
                role: 'admin',
                department: 'admin',
                phone: '1234567890'
            });
            console.log('Admin user created');
        }

        const staffEmail = 'staff@eega.com';
        const staffExists = await User.findOne({ email: staffEmail });

        if (staffExists) {
            console.log('Staff user already exists');
        } else {
            await User.create({
                name: 'Staff User',
                email: staffEmail,
                password: 'staff123',
                role: 'staff',
                department: 'caretaker',
                phone: '0987654321'
            });
            console.log('Staff user created');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
