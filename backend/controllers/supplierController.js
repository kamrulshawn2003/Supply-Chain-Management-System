const { Supplier } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.createSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Supplier created',
        supplier
    });
});

exports.getSuppliers = asyncHandler(async (req, res) => {
    const suppliers = await Supplier.findAll({
        order: [['id', 'ASC']]
    });

    res.json({
        success: true,
        data: suppliers
    });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw new AppError('Supplier not found', 404);

    await supplier.update(req.body);

    res.json({
        success: true,
        message: 'Supplier updated',
        supplier
    });
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
    const deletedCount = await Supplier.destroy({
        where: { id: req.params.id }
    });

    if (!deletedCount) throw new AppError('Supplier not found', 404);

    res.json({
        success: true,
        message: 'Supplier deleted'
    });
});
