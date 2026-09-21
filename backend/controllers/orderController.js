const asyncHandler = require('../utils/asyncHandler'); 
const orderService = require('../services/orderService');

// Get single order by ID (for /orders/:id detail page)
exports.getOrderById = asyncHandler(async (req, res) => {
    const order = await orderService.getSingleOrder({
        id: req.params.id,
        user: req.user
    });
    res.status(200).json({
        success: true,
        data: order
    });
});

exports.createOrder = asyncHandler(async (req, res) => {
    const order = await orderService.createOrder({
        user: req.user,
        payload: req.body
    });

    res.status(201).json({
        success: true,
        message: 'Order created',
        data: order
    });
});

// List all filtered orders (standard wrapped response)
exports.getOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getOrders({
        user: req.user,
        query: req.query
    });

    res.json({
        success: true,
        data: orders
    });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus({
        id: req.params.id,
        status: req.body.status,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Order status updated',
        data: order
    });
});

exports.assignDriver = asyncHandler(async (req, res) => {
    const order = await orderService.assignDriver({
        id: req.params.id,
        driverId: req.body.driverId,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Driver assigned successfully',
        data: order
    });
});

exports.getDriverOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getOrders({
        user: req.user
    });

    res.json({
        success: true,
        data: orders
    });
});

exports.driverUpdateStatus = asyncHandler(async (req, res) => {
    const order = await orderService.driverUpdateStatus({
        id: req.params.id,
        status: req.body.status,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Status updated',
        data: order
    });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
    await orderService.deleteOrder({
        id: req.params.id,
        user: req.user
    });

    res.json({
        success: true,
        message: 'Order deleted'
    });
});