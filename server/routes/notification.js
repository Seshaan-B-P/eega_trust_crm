const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipientRole: req.user.role
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('createdBy', 'name');

        res.status(200).json({
            success: true,
            data: notifications.map(n => ({
                ...n.toObject(),
                isRead: n.readBy.includes(req.user._id)
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (!notification.readBy.includes(req.user._id)) {
            notification.readBy.push(req.user._id);
            await notification.save();
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipientRole: req.user.role,
            readBy: { $ne: req.user._id }
        });

        await Promise.all(notifications.map(n => {
            n.readBy.push(req.user._id);
            return n.save();
        }));

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
