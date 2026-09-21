const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.post(
    '/',
    auth,
    role('admin', 'warehouse_manager', 'supplier'),
    validators.product,
    validateRequest,
    productController.createProduct
);

router.get(
    '/',
    auth,
    productController.getProducts
);

// ✅ ADDED: Get product by ID route (FIX 1)
router.get(
    '/:id',
    auth,
    validators.idParam,
    validateRequest,
    productController.getProductById
);

router.put(
    '/:id',
    auth,
    role('admin', 'supplier'),
    validators.idParam,
    validators.product,
    validateRequest,
    productController.updateProduct
);

router.delete(
    '/:id',
    auth,
    role('admin', 'supplier'),
    validators.idParam,
    validateRequest,
    productController.deleteProduct
);

module.exports = router;