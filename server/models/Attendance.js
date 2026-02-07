const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'sick', 'leave', 'half_day'],
        default: 'present',
        required: true
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    },
    mealAttendance: {
        breakfast: {
            type: String,
            enum: ['present', 'absent', 'late', null],
            default: null
        },
        lunch: {
            type: String,
            enum: ['present', 'absent', 'late', null],
            default: null
        },
        dinner: {
            type: String,
            enum: ['present', 'absent', 'late', null],
            default: null
        }
    },
    temperature: {
        type: Number,
        min: 35,
        max: 45
    },
    symptoms: [{
        type: String,
        trim: true
    }],
    medication: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound unique index for child and date
attendanceSchema.index({ child: 1, date: 1 }, { unique: true });

// Pre-save middleware to set date to start of day
attendanceSchema.pre('save', function(next) {
    if (this.date) {
        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        this.date = date;
    }
    
    // Set check-in time if not set and status is present
    if (this.status === 'present' && !this.checkInTime) {
        this.checkInTime = new Date();
    }
    
    next();
});

// Static method to get attendance for a date range
attendanceSchema.statics.getAttendanceByDateRange = async function(childId, startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return this.find({
        child: childId,
        date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
};

// Static method to mark attendance for multiple children
attendanceSchema.statics.markBulkAttendance = async function(attendanceData, markedBy) {
    const operations = attendanceData.map(record => ({
        updateOne: {
            filter: {
                child: record.child,
                date: new Date(record.date).setHours(0, 0, 0, 0)
            },
            update: {
                $set: {
                    status: record.status,
                    remarks: record.remarks,
                    markedBy: markedBy,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            upsert: true
        }
    }));
    
    return this.bulkWrite(operations);
};

// Method to calculate attendance percentage for a period
attendanceSchema.statics.calculateAttendancePercentage = async function(childId, startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const attendanceRecords = await this.find({
        child: childId,
        date: { $gte: start, $lte: end }
    });
    
    if (attendanceRecords.length === 0) return 0;
    
    const presentDays = attendanceRecords.filter(record => 
        record.status === 'present' || record.status === 'half_day'
    ).length;
    
    return (presentDays / attendanceRecords.length) * 100;
};

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-IN');
});

// Virtual for duration if both check-in and check-out times exist
attendanceSchema.virtual('duration').get(function() {
    if (this.checkInTime && this.checkOutTime) {
        const durationMs = this.checkOutTime - this.checkInTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    return null;
});

module.exports = mongoose.model('Attendance', attendanceSchema);