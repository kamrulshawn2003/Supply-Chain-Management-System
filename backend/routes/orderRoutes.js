const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

// Static driver routes FIRST (before any /:id dynamic routes)
router.get(
    '/driver/orders',
    auth,
    role('driver'),
    orderController.getDriverOrders
);

router.patch(
    '/driver/:id/status',
    auth,
    role('driver'),
    validators.updateOrderStatus,
    validateRequest,
    orderController.driverUpdateStatus
);

// 2. Generic root order route
router.get(
    '/',
    auth,
    validators.reportQuery,
    validateRequest,
    orderController.getOrders
);

router.post(
    '/',
    auth,
    role('customer'),
    validators.createOrder,
    validateRequest,
    orderController.createOrder
);

// ✅ NEW ROUTE: Get single order by ID (fix 404 detail page)
router.get(
    '/:id',
    auth,
    validators.idParam,
    validateRequest,
    orderController.getOrderById
);

// 3. ALL dynamic :id routes come LAST
router.patch(
    '/:id/status',
    auth,
    role('admin', 'warehouse_manager'),
    validators.updateOrderStatus,
    validateRequest,
    orderController.updateOrderStatus
);

router.patch(
    '/:id/assign-driver',
    auth,
    role('admin', 'warehouse_manager'),
    validators.assignDriver,
    validateRequest,
    orderController.assignDriver
);

router.delete(
    '/:id',
    auth,
    role('admin'),
    validators.idParam,
    validateRequest,
    orderController.deleteOrder
);

module.exports = router;