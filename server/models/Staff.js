const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    department: {
        type: String,
        enum: ['caretaker', 'teacher', 'cook', 'doctor', 'administrator', 'security', 'other'],
        default: 'caretaker'
    },
    designation: {
        type: String,
        required: true
    },
    qualification: {
        type: String
    },
    experience: {
        type: Number, // in years
        default: 0
    },
    salary: {
        type: Number
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
        default: 'morning'
    },
    workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    documents: [{
        name: String,
        type: {
            type: String,
            enum: ['aadhar', 'pan', 'degree', 'certificate', 'other']
        },
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    performance: {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        lastReview: Date,
        notes: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    leavingDate: {
        type: Date
    },
    assignedChildrenCount: {
        type: Number,
        default: 0
    },
    maxChildrenCapacity: {
        type: Number,
        default: 10
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for assigned children (populated from User model)
staffSchema.virtual('assignedChildren', {
    ref: 'User',
    localField: 'user',
    foreignField: '_id',
    justOne: false
});

// Static method to generate employee ID
staffSchema.statics.generateEmployeeId = async function () {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = 'EMP';
    const lastStaff = await this.findOne(
        { employeeId: new RegExp(`^${prefix}${currentYear}`) },
        { employeeId: 1 },
        { sort: { employeeId: -1 } }
    );

    let sequence = 1;
    if (lastStaff && lastStaff.employeeId) {
        const lastSequence = parseInt(lastStaff.employeeId.slice(-3)) || 0;
        sequence = lastSequence + 1;
    }

    return `${prefix}${currentYear}${sequence.toString().padStart(3, '0')}`;
};

// Pre-save middleware
staffSchema.pre('save', async function (next) {
    // Generate employee ID if not exists
    if (!this.employeeId) {
        this.employeeId = await this.constructor.generateEmployeeId();
    }

    // Update assignedChildrenCount from User model
    if (this.user) {
        const User = mongoose.model('User');
        const user = await User.findById(this.user).populate('assignedChildren');
        if (user) {
            this.assignedChildrenCount = user.assignedChildren?.length || 0;
        }
    }

    next();
});

// Indexes
staffSchema.index({ department: 1 });
staffSchema.index({ isActive: 1 });

// Method to check if staff can take more children
staffSchema.methods.canTakeMoreChildren = function () {
    return this.assignedChildrenCount < this.maxChildrenCapacity;
};

module.exports = mongoose.model('Staff', staffSchema);