const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['food', 'medicine', 'hygiene', 'office', 'other'],
        default: 'other'
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true
    },
    minThreshold: {
        type: Number,
        default: 10
    },
    location: {
        type: String,
        trim: true
    },
    description: String,
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

inventoryItemSchema.index({ name: 'text', category: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
