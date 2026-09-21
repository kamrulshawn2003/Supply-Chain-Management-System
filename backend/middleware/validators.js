const { body, param, query } = require('express-validator');

const roles = ['admin', 'supplier', 'warehouse_manager', 'customer', 'driver'];
const orderStatuses = ['pending', 'approved', 'shipped', 'delivered', 'cancelled'];
const stockTypes = ['IN', 'OUT', 'ADJUSTMENT'];

const idParam = (name = 'id') => param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`);
const optionalIdBody = (name) => body(name).optional({ nullable: true }).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`);
const requiredIdBody = (name) => body(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`);
const optionalIdQuery = (name) => query(name).optional({ nullable: true }).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`);

const strongPassword = body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character');

module.exports = {
    register: [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
        strongPassword
    ],
    login: [
        body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required')
    ],
    createUser: [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
        strongPassword,
        body('role').isIn(roles).withMessage('Invalid role'),
        optionalIdBody('warehouseId'),
        optionalIdBody('supplierId')
    ],
    updateUser: [
        idParam(),
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
        body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('role').optional().isIn(roles).withMessage('Invalid role'),
        optionalIdBody('warehouseId'),
        optionalIdBody('supplierId')
    ],
    idParam: [idParam()],
    product: [
        body('name').trim().notEmpty().withMessage('Product name is required'),
        body('price').isFloat({ gt: 0 }).withMessage('Product price must be greater than 0'),
        body('description').optional({ nullable: true }).isString(),
        body('category').optional({ nullable: true }).isString(),
        optionalIdBody('SupplierId')
    ],
    supplier: [
        body('name').trim().notEmpty().withMessage('Supplier name is required'),
        body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
        body('phone').optional({ nullable: true }).isString(),
        body('address').optional({ nullable: true }).isString()
    ],
    warehouse: [
        body('name').trim().notEmpty().withMessage('Warehouse name is required'),
        body('location').trim().notEmpty().withMessage('Warehouse location is required'),
        body('manager').optional({ nullable: true }).isString(),
        body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
    ],
    updateStock: [
        requiredIdBody('productId'),
        requiredIdBody('warehouseId'),
        body('type').isIn(stockTypes).withMessage('Type must be IN, OUT or ADJUSTMENT'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative whole number'),
        body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be non-negative')
    ],
    transferStock: [
        requiredIdBody('productId'),
        requiredIdBody('fromWarehouseId'),
        requiredIdBody('toWarehouseId'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than 0')
    ],
    createOrder: [
        requiredIdBody('productId'),
        requiredIdBody('warehouseId'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than 0'),
        body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required')
    ],
    updateOrderStatus: [
        idParam(),
        body('status').isIn(orderStatuses).withMessage('Invalid order status')
    ],
    assignDriver: [
        idParam(),
        requiredIdBody('driverId')
    ],
    reportQuery: [
        query('status').optional().isIn(orderStatuses).withMessage('Invalid order status'),
        query('from').optional().isISO8601().withMessage('from must be an ISO date'),
        query('to').optional().isISO8601().withMessage('to must be an ISO date')
    ],
    inventoryQuery: [
        optionalIdQuery('warehouseId')
    ]
};
