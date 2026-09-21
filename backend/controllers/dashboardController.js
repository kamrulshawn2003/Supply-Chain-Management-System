const { Op, fn, col } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const {
    User,
    Product,
    Supplier,
    Warehouse,
    Inventory,
    Order
} = require('../models');
const inventoryService = require('../services/inventoryService');
const orderService = require('../services/orderService');

exports.adminDashboard = asyncHandler(async (req, res) => {
    const [
        users,
        products,
        suppliers,
        warehouses,
        lowStock,
        ordersByStatus
    ] = await Promise.all([
        User.count(),
        Product.count(),
        Supplier.count(),
        Warehouse.count(),
        inventoryService.getLowStock({ user: req.user }),
        Order.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status']
        })
    ]);

    res.json({
        success: true,
        data: {
            counts: { users, products, suppliers, warehouses },
            lowStockCount: lowStock.length,
            ordersByStatus
        }
    });
});

exports.warehouseDashboard = asyncHandler(async (req, res) => {
    const warehouseId = req.user.warehouseId || 0;
    const [inventoryItems, lowStock, orders] = await Promise.all([
        Inventory.count({ where: { warehouseId } }),
        inventoryService.getLowStock({ user: req.user }),
        orderService.getOrders({ user: req.user })
    ]);

    res.json({
        success: true,
        data: {
            warehouseId,
            inventoryItems,
            lowStockCount: lowStock.length,
            openOrders: orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length
        }
    });
});

exports.driverDashboard = asyncHandler(async (req, res) => {
    const orders = await orderService.getOrders({ user: req.user });

    res.json({
        success: true,
        data: {
            assignedOrders: orders.length,
            activeOrders: orders.filter((order) => ['approved', 'shipped'].includes(order.status)).length,
            deliveredOrders: orders.filter((order) => order.status === 'delivered').length
        }
    });
});
