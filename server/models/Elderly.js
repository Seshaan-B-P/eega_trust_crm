const mongoose = require('mongoose');

const elderlySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    photo: {
        type: String // URL to uploaded photo
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [18, 'Age must be at least 18']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    dateOfAdmission: {
        type: Date,
        default: Date.now
    },
    medicalConditions: [{
        condition: String,
        diagnosedDate: Date,
        medications: [String],
        notes: String
    }],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        address: String
    },
    assignedStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to your existing User model (staff)
    },
    specialNeeds: {
        type: String,
        enum: ['Wheelchair', 'Bedridden', 'Walker', 'Oxygen', 'None'],
        default: 'None'
    },
    dietaryRestrictions: [String],
    allergies: [String],
    documents: [{
        name: String,
        url: String,
        uploadedAt: Date
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Hospitalized', 'Deceased', 'Transferred'],
        default: 'Active'
    },
    dailyActivityLog: [{
        date: {
            type: Date,
            default: Date.now
        },
        activityType: {
            type: String,
            enum: ['Meal', 'Medication', 'Exercise', 'Health Check', 'Recreation', 'Other']
        },
        description: String,
        staffNotes: String,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
elderlySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Elderly', elderlySchema);