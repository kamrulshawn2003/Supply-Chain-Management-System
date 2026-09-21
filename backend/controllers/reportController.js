const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { Inventory, Product, Warehouse, InventoryMovement } = require('../models');
const orderService = require('../services/orderService');
const inventoryService = require('../services/inventoryService');

exports.orderReport = asyncHandler(async (req, res) => {
    const orders = await orderService.getOrders({
        user: req.user,
        query: req.query
    });

    const totalRevenue = orders.reduce((sum, order) => {
        if (order.status === 'cancelled') return sum;
        return sum + Number(order.totalPrice || 0);
    }, 0);

    res.json({
        success: true,
        data: {
            count: orders.length,
            totalRevenue,
            orders
        }
    });
});

exports.inventoryReport = asyncHandler(async (req, res) => {
    const inventory = await inventoryService.listInventory({ user: req.user });
    const lowStock = await inventoryService.getLowStock({ user: req.user });

    const where = {};
    if (req.user.role === 'warehouse_manager') {
        where.warehouseId = req.user.warehouseId || 0;
    }

    if (req.query.from || req.query.to) {
        where.createdAt = {};
        if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
        if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to);
    }

    const productInclude = { model: Product };

    if (req.user.role === 'supplier') {
        productInclude.where = { SupplierId: req.user.supplierId || 0 };
    }

    const movements = await InventoryMovement.findAll({
        where,
        include: [productInclude, Warehouse],
        order: [['createdAt', 'DESC']]
    });

    res.json({
        success: true,
        data: {
            inventoryCount: inventory.length,
            lowStockCount: lowStock.length,
            inventory,
            movements
        }
    });
});
