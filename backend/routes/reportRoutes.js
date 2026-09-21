const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get(
    '/orders',
    auth,
    role('admin', 'warehouse_manager', 'supplier'),
    validators.reportQuery,
    validateRequest,
    reportController.orderReport
);

router.get(
    '/inventory',
    auth,
    role('admin', 'warehouse_manager', 'supplier'),
    validators.reportQuery,
    validateRequest,
    reportController.inventoryReport
);

module.exports = router;
