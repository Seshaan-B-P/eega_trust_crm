const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    donorName: {
        type: String,
        required: [true, 'Donor name is required'],
        trim: true
    },
    donorEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    donorPhone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    donorAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be greater than 0']
    },
    donationType: {
        type: String,
        enum: ['cash', 'cheque', 'online', 'goods', 'other'],
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'other']
    },
    transactionId: {
        type: String,
        trim: true
    },
    chequeDetails: {
        chequeNumber: String,
        bankName: String,
        branch: String,
        date: Date
    },
    goodsDetails: [{
        item: String,
        quantity: Number,
        unit: String,
        description: String,
        estimatedValue: Number
    }],
    description: {
        type: String,
        trim: true
    },
    purpose: {
        type: String,
        enum: ['general', 'education', 'medical', 'food', 'shelter', 'festival', 'emergency', 'other'],
        default: 'general'
    },
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    receiptGenerated: {
        type: Boolean,
        default: false
    },
    receiptUrl: String,
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'cancelled'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationDate: Date,
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    taxBenefit: {
        eligible: { type: Boolean, default: true },
        certificateIssued: { type: Boolean, default: false },
        certificateNumber: String,
        certificateUrl: String
    },
    thankYouSent: {
        type: Boolean,
        default: false
    },
    thankYouDate: Date,
    notes: String,
    tags: [String],
    attachments: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate donation ID
donationSchema.pre('validate', async function (next) {
    if (!this.donationId) {
        const count = await mongoose.model('Donation').countDocuments();
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const sequence = (count + 1).toString().padStart(5, '0');
        this.donationId = `DON${year}${month}${sequence}`;
    }

    // Generate receipt number if verified
    if (this.status === 'verified' && !this.receiptNumber) {
        const receiptCount = await mongoose.model('Donation').countDocuments({ status: 'verified' });
        const year = new Date().getFullYear().toString().slice(-2);
        const sequence = (receiptCount + 1).toString().padStart(6, '0');
        this.receiptNumber = `RCPT${year}${sequence}`;
    }

    next();
});

// Indexes
donationSchema.index({ donorName: 1 });
donationSchema.index({ date: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ donationType: 1 });
donationSchema.index({ purpose: 1 });

module.exports = mongoose.model('Donation', donationSchema);