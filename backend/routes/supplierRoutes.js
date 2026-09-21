const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.post(
    '/',
    auth,
    role('admin'),
    validators.supplier,
    validateRequest,
    supplierController.createSupplier
);

router.get(
    '/',
    auth,
    role('admin', 'supplier'),
    supplierController.getSuppliers
);

router.put(
    '/:id',
    auth,
    role('admin'),
    validators.idParam,
    validators.supplier,
    validateRequest,
    supplierController.updateSupplier
);

router.delete(
    '/:id',
    auth,
    role('admin'),
    validators.idParam,
    validateRequest,
    supplierController.deleteSupplier
);

module.exports = router;
