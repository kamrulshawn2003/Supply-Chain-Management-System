const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get(
    '/',
    auth,
    notificationController.getNotifications
);

router.get(
    '/unread-count',
    auth,
    notificationController.getUnreadCount
);

router.patch(
    '/read-all',
    auth,
    notificationController.markAllRead
);

router.patch(
    '/:id/read',
    auth,
    validators.idParam,
    validateRequest,
    notificationController.markRead
);

module.exports = router;
