const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Ensure Staff model is registered (avoid MissingSchemaError)
require('./Staff');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    phone: String,
    address: String,
    dateOfJoining: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    profileImage: String,
    assignedChildren: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
    createdAt: { type: Date, default: Date.now },
    staffProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    notificationSettings: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
    }
});

// Hash password and normalize email before saving
userSchema.pre('save', async function (next) {
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }
    
    if (!this.isModified('password')) {
        console.log('Password not modified, skipping hash');
        return next();
    }
    console.log('Password modified, trimming and hashing...');
    try {
        // Trim password before hashing to match login behavior
        this.password = this.password.trim();

        // One uppercase, one lowercase, one symbol, min 6 chars
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
        if (!passwordRegex.test(this.password)) {
            const error = new Error('Password must contain at least one uppercase letter, one lowercase letter, and one symbol (special character).');
            error.name = 'ValidationError';
            return next(error);
        }

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully');
        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});
// Add post-save middleware to create/update Staff profile
userSchema.post('save', async function (doc, next) {
    if (doc.role === 'staff') {
        const Staff = mongoose.model('Staff');

        try {
            let staffProfile = await Staff.findOne({ user: doc._id });

            if (!staffProfile) {
                // Create staff profile if doesn't exist
                staffProfile = await Staff.create({
                    user: doc._id,
                    designation: 'Caretaker',
                    createdBy: doc._id
                });

                // Update user with staff profile reference using updateOne to avoid infinite loop
                await mongoose.model('User').updateOne(
                    { _id: doc._id },
                    { $set: { staffProfile: staffProfile._id } }
                );
            }
        } catch (error) {
            console.error('Error creating staff profile:', error);
        }
    }
    next();
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);