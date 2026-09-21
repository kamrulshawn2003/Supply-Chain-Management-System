const { Product, Supplier } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const productPayload = (body, user) => {
    const payload = {
        name: body.name,
        description: body.description,
        price: body.price,
        category: body.category,
        SupplierId: body.SupplierId || null
    };

    if (user.role === 'supplier') {
        payload.SupplierId = user.supplierId;
    }

    return payload;
};

exports.createProduct = asyncHandler(async (req, res) => {
    if (req.user.role === 'supplier' && !req.user.supplierId) {
        throw new AppError('Supplier users must be linked to a supplier profile', 400);
    }

    const product = await Product.create(productPayload(req.body, req.user));

    res.status(201).json({
        success: true,
        message: 'Product created',
        product
    });
});

exports.getProducts = asyncHandler(async (req, res) => {
    const where = {};

    if (req.user.role === 'supplier') {
        where.SupplierId = req.user.supplierId || 0;
    }

    const products = await Product.findAll({
        where,
        include: [Supplier],
        order: [['id', 'ASC']]
    });

    res.json(products);
});

// ✅ ADDED: Get single product by ID (FIX 2)
exports.getProductById = asyncHandler(async (req, res) => {
    const where = { id: req.params.id };

    // Enforce supplier permission (matches your update/delete logic)
    if (req.user.role === 'supplier') {
        where.SupplierId = req.user.supplierId || 0;
    }

    const product = await Product.findOne({
        where,
        include: [Supplier]
    });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    res.json(product);
});

exports.updateProduct = asyncHandler(async (req, res) => {
    const where = { id: req.params.id };

    if (req.user.role === 'supplier') {
        where.SupplierId = req.user.supplierId || 0;
    }

    const product = await Product.findOne({ where });
    if (!product) throw new AppError('Product not found', 404);

    await product.update(productPayload(req.body, req.user));

    res.json({
        success: true,
        message: 'Product updated',
        product
    });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
    const where = { id: req.params.id };

    if (req.user.role === 'supplier') {
        where.SupplierId = req.user.supplierId || 0;
    }

    const deletedCount = await Product.destroy({ where });
    if (!deletedCount) throw new AppError('Product not found', 404);

    res.json({
        success: true,
        message: 'Product deleted'
    });
});