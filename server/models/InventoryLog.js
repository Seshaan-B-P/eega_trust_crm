const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['in', 'out', 'adjustment']
    },
    quantity: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

inventoryLogSchema.index({ item: 1, date: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
