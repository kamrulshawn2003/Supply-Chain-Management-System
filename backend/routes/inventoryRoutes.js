const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get(
    '/',
    auth,
    role('admin', 'warehouse_manager', 'supplier'),
    validators.inventoryQuery,
    validateRequest,
    inventoryController.getInventory
);

router.get(
    '/low-stock',
    auth,
    role('admin', 'warehouse_manager'),
    inventoryController.getLowStock
);

router.get(
    '/:id',
    auth,
    role('admin', 'warehouse_manager', 'supplier'),
    validators.idParam,
    validateRequest,
    inventoryController.getInventoryById
);

router.post(
    '/update',
    auth,
    role('admin', 'warehouse_manager'),
    validators.updateStock,
    validateRequest,
    inventoryController.updateStock
);

router.post(
    '/transfer',
    auth,
    role('admin', 'warehouse_manager'),
    validators.transferStock,
    validateRequest,
    inventoryController.transferStock
);

module.exports = router;
