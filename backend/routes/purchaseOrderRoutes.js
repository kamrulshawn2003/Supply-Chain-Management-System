const express = require('express');
const router = express.Router();

const purchaseOrderController = require('../controllers/purchaseOrderController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.post(
    '/',
    auth,
    role('admin'),
    validators.purchaseOrder,
    validateRequest,
    purchaseOrderController.createPurchaseOrder
);

router.get(
    '/',
    auth,
    role('admin', 'supplier'),
    purchaseOrderController.getPurchaseOrders
);

router.get(
    '/:id',
    auth,
    role('admin', 'supplier'),
    validators.idParam,
    validateRequest,
    purchaseOrderController.getPurchaseOrderById
);

router.patch(
    '/:id/approve',
    auth,
    role('admin'),
    validators.idParam,
    validateRequest,
    purchaseOrderController.approvePurchaseOrder
);

router.post(
    '/:id/receive',
    auth,
    role('admin', 'warehouse_manager'),
    validators.idParam,
    validateRequest,
    purchaseOrderController.receivePurchaseOrder
);

router.patch(
    '/:id/cancel',
    auth,
    role('admin'),
    validators.idParam,
    validateRequest,
    purchaseOrderController.cancelPurchaseOrder
);

module.exports = router;
