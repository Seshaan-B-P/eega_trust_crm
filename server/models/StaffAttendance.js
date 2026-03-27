const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Linking to the User record (which has role 'staff')
        required: true,
        index: true
    },
    staffProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'leave', 'half_day'],
        default: 'present',
        required: true
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
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

// Compound unique index for staff and date
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

// Pre-save middleware to set date to start of day
staffAttendanceSchema.pre('save', function (next) {
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

// Static method for bulk marking
staffAttendanceSchema.statics.markBulkAttendance = async function (attendanceData, markedBy) {
    const operations = attendanceData.map(record => ({
        updateOne: {
            filter: {
                staff: record.staff,
                date: new Date(record.date).setHours(0, 0, 0, 0)
            },
            update: {
                $set: {
                    staffProfile: record.staffProfile,
                    status: record.status,
                    remarks: record.remarks,
                    markedBy: markedBy,
                    updatedAt: new Date(),
                    // Set check-in time if status is present and it hasn't been set yet
                    ...(record.status === 'present' ? { checkInTime: record.checkInTime || new Date() } : {})
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

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
