const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['food', 'medical', 'salary', 'staff', 'utilities', 'maintenance', 'education', 'festival', 'other'],
        default: 'other'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be greater than 0']
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'other'],
        required: true
    },
    vendorName: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    billUrl: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'cancelled'],
        default: 'paid'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate expense ID
expenseSchema.pre('validate', async function (next) {
    if (!this.expenseId) {
        const count = await mongoose.model('Expense').countDocuments();
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const sequence = (count + 1).toString().padStart(5, '0');
        this.expenseId = `EXP${year}${month}${sequence}`;
    }
    next();
});

// Indexes
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ status: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
