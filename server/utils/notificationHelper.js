const Notification = require('../models/Notification');

/**
 * Create a notification for a specific role
 * @param {Object} options - Notification options
 * @param {String} options.title - Title of the notification
 * @param {String} options.message - Message body
 * @param {String} options.type - Type of notification (donation, report, etc.)
 * @param {Object} options.data - Related data (e.g., childId, donationId)
 * @param {String} options.createdBy - User ID who triggered the notification
 * @param {String} options.recipientRole - Who should receive this (default 'admin')
 */
const createNotification = async ({
    title,
    message,
    type = 'other',
    data = {},
    createdBy,
    recipientRole = 'admin'
}) => {
    try {
        const notification = new Notification({
            title,
            message,
            type,
            data,
            createdBy,
            recipientRole
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = { createNotification };
