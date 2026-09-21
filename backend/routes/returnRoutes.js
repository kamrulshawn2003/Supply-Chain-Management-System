const express = require('express');
const router = express.Router();

const returnController = require('../controllers/returnController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.post(
    '/',
    auth,
    role('customer'),
    validators.returnRequest,
    validateRequest,
    returnController.createReturn
);

router.get(
    '/',
    auth,
    role('admin', 'warehouse_manager', 'customer'),
    returnController.getReturns
);

router.patch(
    '/:id',
    auth,
    role('admin', 'warehouse_manager'),
    validators.idParam,
    validators.returnStatus,
    validateRequest,
    returnController.handleReturn
);

module.exports = router;
