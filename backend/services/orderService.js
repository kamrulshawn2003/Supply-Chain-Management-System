const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const {
    sequelize,
    Order,
    Product,
    User,
    Warehouse,
    Supplier
} = require('../models');
const inventoryService = require('./inventoryService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const transitions = {
    pending: ['approved', 'cancelled'],
    approved: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
};

const orderInclude = [
    { model: Product, include: [Supplier] },
    { model: User, attributes: ['id', 'name', 'email', 'role'] },
    { model: Warehouse },
    { model: User, as: 'Driver', attributes: ['id', 'name', 'email', 'role'] }
];

const assertWarehouseScope = (user, order) => {
    if (user.role === 'warehouse_manager' && order.WarehouseId !== user.warehouseId) {
        throw new AppError('Access denied for this warehouse order', 403);
    }
};

exports.createOrder = async ({ user, payload }) => {
    if (user.role !== 'customer') {
        throw new AppError('Only customers can create orders', 403);
    }

    return sequelize.transaction(async (transaction) => {
        const productId = Number(payload.productId);
        const warehouseId = Number(payload.warehouseId);
        const quantity = Number(payload.quantity);

        const [product, warehouse] = await Promise.all([
            Product.findByPk(productId, { transaction }),
            Warehouse.findByPk(warehouseId, { transaction })
        ]);

        if (!product) throw new AppError('Product not found', 404);
        if (!warehouse) throw new AppError('Warehouse not found', 404);

        const order = await Order.create({
            ProductId: productId,
            WarehouseId: warehouseId,
            UserId: user.id,
            quantity,
            totalPrice: Number(product.price) * quantity,
            shippingAddress: payload.shippingAddress
        }, { transaction });

        await inventoryService.decrementForOrder({
            productId,
            warehouseId,
            quantity,
            orderId: order.id,
            userId: user.id,
            transaction
        });

        await auditService.log({
            action: 'ORDER_CREATED',
            entityType: 'Order',
            entityId: order.id,
            performedBy: user.id,
            details: { productId, warehouseId, quantity },
            transaction
        });

        // Notify admins about the new pending order
        await notificationService.notifyRole({
            role: 'admin',
            type: 'ORDER',
            title: 'New order received',
            message: `New order #${order.id} ($${Number(order.totalPrice).toFixed(2)}) is pending approval.`,
            link: `/orders/${order.id}`,
            transaction
        });

        return order.reload({ include: orderInclude, transaction });
    });
};

exports.getOrders = async ({ user, query = {} }) => {
    const where = {};
    const productInclude = { model: Product, include: [Supplier] };

    if (user.role === 'customer') where.UserId = user.id;
    if (user.role === 'driver') where.DriverId = user.id;
    if (user.role === 'warehouse_manager') where.WarehouseId = user.warehouseId || 0;
    if (user.role === 'supplier') productInclude.where = { SupplierId: user.supplierId || 0 };

    if (query.status) where.status = query.status;
    if (query.from || query.to) {
        where.createdAt = {};
        if (query.from) where.createdAt[Op.gte] = new Date(query.from);
        if (query.to) where.createdAt[Op.lte] = new Date(query.to);
    }

    return Order.findAll({
        where,
        // Explicitly select foreign key columns so DriverId/UserId/WarehouseId exist in frontend response
        attributes: [
            'id',
            'status',
            'quantity',
            'totalPrice',
            'shippingAddress',
            'createdAt',
            'shippedAt',
            'deliveredAt',
            'cancelledAt',
            'ProductId',
            'WarehouseId',
            'UserId',
            'DriverId'
        ],
        include: [
            productInclude,
            { model: User, attributes: ['id', 'name', 'email', 'role'] },
            { model: Warehouse },
            { model: User, as: 'Driver', attributes: ['id', 'name', 'email', 'role'] }
        ],
        order: [['createdAt', 'DESC']]
    });
};

// Get single order by ID for /orders/:id detail page
exports.getSingleOrder = async ({ id, user }) => {
    const order = await Order.findByPk(id, {
        include: orderInclude
    });

    if (!order) throw new AppError('Order not found', 404);

    // Role-based access control for single order view
    if (user.role === 'customer' && order.UserId !== user.id) {
        throw new AppError('You are not allowed to view this order', 403);
    }
    if (user.role === 'driver' && order.DriverId !== user.id) {
        throw new AppError('This order is not assigned to you', 403);
    }
    if (user.role === 'warehouse_manager' && order.WarehouseId !== user.warehouseId) {
        throw new AppError('Access denied for orders outside your warehouse', 403);
    }

    return order;
};

exports.updateOrderStatus = async ({ id, status, user }) => {
    return sequelize.transaction(async (transaction) => {
        const order = await Order.findByPk(id, {
            include: orderInclude,
            transaction,
            lock: true
        });

        if (!order) throw new AppError('Order not found', 404);
        assertWarehouseScope(user, order);

        if (!transitions[order.status].includes(status)) {
            throw new AppError(`Cannot transition order from ${order.status} to ${status}`, 400);
        }

        const previousStatus = order.status;
        order.status = status;

        if (status === 'shipped') order.shippedAt = new Date();
        if (status === 'delivered') order.deliveredAt = new Date();
        if (status === 'cancelled') {
            order.cancelledAt = new Date();
            await inventoryService.restockCancelledOrder({
                productId: order.ProductId,
                warehouseId: order.WarehouseId,
                quantity: order.quantity,
                orderId: order.id,
                userId: user.id,
                transaction
            });
        }

        await order.save({ transaction });
        await auditService.log({
            action: 'ORDER_STATUS_CHANGED',
            entityType: 'Order',
            entityId: order.id,
            performedBy: user.id,
            details: { previousStatus, status },
            transaction
        });

        // Notify the customer about the status change
        await notificationService.notify({
            userId: order.UserId,
            type: 'ORDER',
            title: `Order #${order.id} ${status}`,
            message: `Your order #${order.id} is now ${status}.`,
            link: `/orders/${order.id}`,
            transaction
        });

        return order.reload({ include: orderInclude, transaction });
    });
};

exports.assignDriver = async ({ id, driverId, user }) => {
    return sequelize.transaction(async (transaction) => {
        const order = await Order.findByPk(id, { transaction, lock: true });
        if (!order) throw new AppError('Order not found', 404);

        assertWarehouseScope(user, order);

        if (!['approved', 'shipped'].includes(order.status)) {
            throw new AppError('Drivers can only be assigned to approved or shipped orders', 400);
        }

        const driver = await User.findOne({
            where: { id: driverId, role: 'driver' },
            transaction
        });

        if (!driver) throw new AppError('Driver not found', 404);
        if (driver.warehouseId && driver.warehouseId !== order.WarehouseId) {
            throw new AppError('Driver does not belong to this order warehouse', 400);
        }

        order.DriverId = driver.id;
        await order.save({ transaction });

        await auditService.log({
            action: 'DRIVER_ASSIGNED',
            entityType: 'Order',
            entityId: order.id,
            performedBy: user.id,
            details: { driverId: driver.id },
            transaction
        });

        await notificationService.notify({
            userId: driver.id,
            type: 'ORDER',
            title: 'Delivery assigned',
            message: `Order #${order.id} has been assigned to you for delivery.`,
            link: `/orders/${order.id}`,
            transaction
        });

        return order.reload({ include: orderInclude, transaction });
    });
};

exports.driverUpdateStatus = async ({ id, status, user }) => {
    if (!['shipped', 'delivered'].includes(status)) {
        throw new AppError('Drivers may only mark orders as shipped or delivered', 400);
    }

    const order = await Order.findByPk(id);
    if (!order) throw new AppError('Order not found', 404);
    if (order.DriverId !== user.id) throw new AppError('Not your assigned order', 403);

    return exports.updateOrderStatus({ id, status, user: { ...user, role: 'driver' } });
};

exports.cancelOrder = async ({ id, user }) => {
    return sequelize.transaction(async (transaction) => {
        const order = await Order.findByPk(id, {
            include: orderInclude,
            transaction,
            lock: true
        });
        if (!order) throw new AppError('Order not found', 404);

        if (user.role === 'customer' && order.UserId !== user.id) {
            throw new AppError('You can only cancel your own orders', 403);
        }
        if (user.role === 'warehouse_manager' && order.WarehouseId !== user.warehouseId) {
            throw new AppError('Access denied for orders outside your warehouse', 403);
        }

        if (!['pending', 'approved'].includes(order.status)) {
            throw new AppError('Only pending or approved orders can be cancelled', 400);
        }

        const previousStatus = order.status;
        order.status = 'cancelled';
        order.cancelledAt = new Date();

        await inventoryService.restockCancelledOrder({
            productId: order.ProductId,
            warehouseId: order.WarehouseId,
            quantity: order.quantity,
            orderId: order.id,
            userId: user.id,
            transaction
        });

        await order.save({ transaction });
        await auditService.log({
            action: 'ORDER_CANCELLED',
            entityType: 'Order',
            entityId: order.id,
            performedBy: user.id,
            details: { previousStatus },
            transaction
        });

        await notificationService.notify({
            userId: order.UserId,
            type: 'ORDER',
            title: `Order #${order.id} cancelled`,
            message: `Your order #${order.id} has been cancelled.`,
            link: `/orders/${order.id}`,
            transaction
        });

        return order.reload({ include: orderInclude, transaction });
    });
};

exports.deleteOrder = async ({ id, user }) => {
    return sequelize.transaction(async (transaction) => {
        const order = await Order.findByPk(id, { transaction, lock: true });
        if (!order) throw new AppError('Order not found', 404);

        if (!['cancelled', 'delivered'].includes(order.status)) {
            throw new AppError('Only cancelled or delivered orders can be deleted', 400);
        }

        await order.destroy({ transaction });
        await auditService.log({
            action: 'ORDER_DELETED',
            entityType: 'Order',
            entityId: Number(id),
            performedBy: user.id,
            details: { status: order.status },
            transaction
        });
    });
};

exports.orderInclude = orderInclude;