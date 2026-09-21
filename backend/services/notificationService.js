const { Notification, User } = require('../models');

// Create a notification for a single user
exports.notify = async ({ userId, type, title, message, link, transaction }) => {
    if (!userId) return null;
    return Notification.create({
        userId,
        type,
        title,
        message,
        link
    }, { transaction });
};

// Create notifications for every user with the given role (optionally in one warehouse)
exports.notifyRole = async ({ role, type, title, message, link, transaction, warehouseId }) => {
    const where = { role };
    if (warehouseId) where.warehouseId = warehouseId;

    const users = await User.findAll({ where, attributes: ['id'] });
    if (!users.length) return [];

    return Notification.bulkCreate(
        users.map((user) => ({ userId: user.id, type, title, message, link })),
        { transaction }
    );
};

exports.listForUser = async ({ userId, limit = 50 }) => {
    return Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit
    });
};

exports.unreadCount = async ({ userId }) => {
    return Notification.count({ where: { userId, read: false } });
};

exports.markRead = async ({ id, userId }) => {
    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) return null;

    if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
    }
    return notification;
};

exports.markAllRead = async ({ userId }) => {
    return Notification.update(
        { read: true, readAt: new Date() },
        { where: { userId, read: false } }
    );
};
