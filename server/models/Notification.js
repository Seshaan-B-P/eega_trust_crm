const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientRole: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'admin'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['donation', 'report', 'child', 'staff', 'other'],
        default: 'other'
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
