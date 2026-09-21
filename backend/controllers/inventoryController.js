const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventoryService');

exports.getInventory = asyncHandler(async (req, res) => {
    const items = await inventoryService.listInventory({
        user: req.user,
        warehouseId: req.query.warehouseId
    });

    res.json({
        success: true,
        data: items
    });
});

exports.getInventoryById = asyncHandler(async (req, res) => {
    const item = await inventoryService.getInventoryById({
        id: req.params.id,
        user: req.user
    });

    res.json({
        success: true,
        data: item
    });
});

exports.updateStock = asyncHandler(async (req, res) => {
    const inventory = await inventoryService.updateStock({
        payload: req.body,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Stock updated',
        data: inventory
    });
});

exports.transferStock = asyncHandler(async (req, res) => {
    const result = await inventoryService.transferStock({
        payload: req.body,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Stock transferred',
        data: result
    });
});

exports.getLowStock = asyncHandler(async (req, res) => {
    const items = await inventoryService.getLowStock({ user: req.user });

    res.json({
        success: true,
        data: items
    });
});
