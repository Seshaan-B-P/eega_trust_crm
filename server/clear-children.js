const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Child = require('./models/Child');
const DailyReport = require('./models/DailyReport');
const Attendance = require('./models/Attendance');

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Clearing Child data...');
        await Child.deleteMany({});
        console.log('Child data cleared.');

        console.log('Clearing DailyReport data...');
        await DailyReport.deleteMany({});
        console.log('DailyReport data cleared.');

        console.log('Clearing Attendance data...');
        await Attendance.deleteMany({});
        console.log('Attendance data cleared.');

        console.log('Context of removing children data: Cleared related reports and attendance.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
