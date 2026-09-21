const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

exports.getNotifications = asyncHandler(async (req, res) => {
    const notifications = await notificationService.listForUser({
        userId: req.user.id,
        limit: Number(req.query.limit) || 50
    });

    res.json({
        success: true,
        data: notifications
    });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.unreadCount({ userId: req.user.id });

    res.json({
        success: true,
        data: { count }
    });
});

exports.markRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead({
        id: req.params.id,
        userId: req.user.id
    });

    if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
    }

    res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
    });
});

exports.markAllRead = asyncHandler(async (req, res) => {
    const updated = await notificationService.markAllRead({ userId: req.user.id });

    res.json({
        success: true,
        message: 'All notifications marked as read',
        data: { updated: updated[0] }
    });
});
