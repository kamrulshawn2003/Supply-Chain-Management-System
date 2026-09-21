const asyncHandler = require('../utils/asyncHandler');
const purchaseOrderService = require('../services/purchaseOrderService');

exports.createPurchaseOrder = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.createPurchaseOrder({
        user: req.user,
        payload: req.body
    });

    res.status(201).json({
        success: true,
        message: 'Purchase order created',
        data: po
    });
});

exports.getPurchaseOrders = asyncHandler(async (req, res) => {
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({ user: req.user });

    res.json({
        success: true,
        data: purchaseOrders
    });
});

exports.getPurchaseOrderById = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.getPurchaseOrderById({
        id: req.params.id,
        user: req.user
    });

    res.json({
        success: true,
        data: po
    });
});

exports.approvePurchaseOrder = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.approvePurchaseOrder({
        id: req.params.id,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Purchase order approved',
        data: po
    });
});

exports.receivePurchaseOrder = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.receivePurchaseOrder({
        id: req.params.id,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Purchase order received, stock updated',
        data: po
    });
});

exports.cancelPurchaseOrder = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.cancelPurchaseOrder({
        id: req.params.id,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Purchase order cancelled',
        data: po
    });
});
