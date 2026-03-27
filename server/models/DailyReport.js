const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    date: { type: Date, required: true, default: Date.now },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: false },
    elderly: { type: mongoose.Schema.Types.ObjectId, ref: 'Elderly', required: false },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    morningMeal: { type: String, enum: ['good', 'average', 'poor', 'skipped'] },
    afternoonMeal: { type: String, enum: ['good', 'average', 'poor', 'skipped'] },
    eveningMeal: { type: String, enum: ['good', 'average', 'poor', 'skipped'] },
    healthStatus: {
        temperature: Number,
        symptoms: [String],
        medication: String,
        overall: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] }
    },
    activities: [{
        activity: String,
        duration: String,
        remarks: String
    }],
    behavior: { type: String, enum: ['excellent', 'good', 'average', 'needs_attention'] },
    specialNotes: String,
    needsAttention: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);