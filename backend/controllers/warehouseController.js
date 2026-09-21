const { Warehouse } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.createWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Warehouse created',
        warehouse
    });
});

exports.getWarehouses = asyncHandler(async (req, res) => {
    const warehouses = await Warehouse.findAll({
        order: [['id', 'ASC']]
    });

    res.json({
        success: true,
        data: warehouses
    });
});

exports.getWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    res.json({
        success: true,
        data: warehouse
    });
});

exports.updateWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    await warehouse.update(req.body);

    res.json({
        success: true,
        message: 'Warehouse updated',
        warehouse
    });
});

exports.deleteWarehouse = asyncHandler(async (req, res) => {
    const deletedCount = await Warehouse.destroy({
        where: { id: req.params.id }
    });

    if (!deletedCount) throw new AppError('Warehouse not found', 404);

    res.json({
        success: true,
        message: 'Warehouse deleted'
    });
});
