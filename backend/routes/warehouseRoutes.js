const express = require('express');
const router = express.Router();

const warehouseController = require('../controllers/warehouseController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

// Only keep standard REST POST / to create warehouse
router.post(
    '/',
    auth,
    role('admin'),
    validators.warehouse,
    validateRequest,
    warehouseController.createWarehouse
);

// Customers need the warehouse list to create orders, so they can read it too.
router.get(
    '/',
    auth,
    role('admin', 'warehouse_manager', 'customer'),
    warehouseController.getWarehouses
);

router.get(
    '/:id',
    auth,
    role('admin', 'warehouse_manager'),
    validators.idParam,
    validateRequest,
    warehouseController.getWarehouse
);

router.put(
    '/:id',
    auth,
    role('admin'),
    validators.idParam,
    validators.warehouse,
    validateRequest,
    warehouseController.updateWarehouse
);

router.delete(
    '/:id',
    auth,
    role('admin'),
    validators.idParam,
    validateRequest,
    warehouseController.deleteWarehouse
);

module.exports = router;