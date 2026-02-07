const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    childId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Child name is required'],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    age: {
        type: Number,
        min: 0,
        max: 18
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    dateOfAdmission: {
        type: Date,
        default: Date.now
    },
    dischargeDate: {
        type: Date
    },
    background: {
        type: String,
        required: [true, 'Background information is required']
    },
    medicalHistory: {
        type: String,
        default: 'No significant medical history'
    },
    allergies: {
        type: String,
        default: 'None'
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null],
        default: null
    },
    assignedStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    photo: {
        type: String,
        default: null
    },
    documents: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'discharged', 'transferred'],
        default: 'active'
    },
    guardianInfo: {
        name: String,
        relationship: {
            type: String,
            enum: ['mother', 'father', 'grandparent', 'uncle', 'aunt', 'guardian', 'other', null],
            default: null
        },
        phone: String,
        address: String
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Calculate age before saving
childSchema.pre('save', function(next) {
    if (this.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        this.age = age;
    }
    
    // Update lastUpdated timestamp
    this.lastUpdated = new Date();
    
    next();
});

// Index for searching
childSchema.index({ name: 'text', childId: 'text', 'guardianInfo.name': 'text' });

// Virtual for full name with ID
childSchema.virtual('fullIdentifier').get(function() {
    return `${this.name} (${this.childId})`;
});

// Static method to get next child ID
childSchema.statics.getNextChildId = async function() {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const lastChild = await this.findOne(
        { childId: new RegExp(`^CH${currentYear}`) },
        { childId: 1 },
        { sort: { childId: -1 } }
    );
    
    let sequence = 1;
    if (lastChild && lastChild.childId) {
        const lastSequence = parseInt(lastChild.childId.slice(-3)) || 0;
        sequence = lastSequence + 1;
    }
    
    return `CH${currentYear}${sequence.toString().padStart(3, '0')}`;
};

// Method to get child's status color
childSchema.methods.getStatusColor = function() {
    const colors = {
        active: 'success',
        discharged: 'secondary',
        transferred: 'info'
    };
    return colors[this.status] || 'light';
};

module.exports = mongoose.model('Child', childSchema);