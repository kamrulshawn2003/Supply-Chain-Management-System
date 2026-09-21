const AppError = require('../utils/AppError');
const {
    sequelize,
    ReturnRequest,
    Order,
    Product,
    User,
    Warehouse
} = require('../models');
const inventoryService = require('./inventoryService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const returnInclude = [
    { model: Order, include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: Warehouse }] },
    { model: Product },
    { model: User, as: 'Customer', attributes: ['id', 'name', 'email'] },
    { model: User, as: 'Handler', attributes: ['id', 'name', 'email'] }
];

exports.createReturn = async ({ user, payload }) => {
    return sequelize.transaction(async (transaction) => {
        const order = await Order.findByPk(payload.orderId, { transaction, lock: true });
        if (!order) throw new AppError('Order not found', 404);
        if (order.UserId !== user.id) throw new AppError('You can only return your own orders', 403);
        if (order.status !== 'delivered') throw new AppError('Only delivered orders can be returned', 400);

        const productId = Number(payload.productId);
        const quantity = Number(payload.quantity);

        if (productId !== order.ProductId) {
            throw new AppError('Returned product does not match the order product', 400);
        }
        if (quantity <= 0 || quantity > order.quantity) {
            throw new AppError(`Return quantity must be between 1 and ${order.quantity}`, 400);
        }

        const existing = await ReturnRequest.findOne({
            where: { OrderId: order.id, status: ['pending', 'approved'] },
            transaction
        });
        if (existing) {
            throw new AppError('A return request for this order is already pending or approved', 400);
        }

        const returnRequest = await ReturnRequest.create({
            OrderId: order.id,
            productId,
            quantity,
            reason: payload.reason,
            status: 'pending',
            createdBy: user.id
        }, { transaction });

        await auditService.log({
            action: 'RETURN_REQUESTED',
            entityType: 'ReturnRequest',
            entityId: returnRequest.id,
            performedBy: user.id,
            details: { orderId: order.id, productId, quantity },
            transaction
        });

        // Notify the warehouse manager of the order warehouse (and admins)
        await notificationService.notifyRole({
            role: 'admin',
            type: 'RETURN',
            title: 'New return request',
            message: `Return request #${returnRequest.id} for order #${order.id} is awaiting review.`,
            link: '/returns',
            transaction
        });
        await notificationService.notifyRole({
            role: 'warehouse_manager',
            type: 'RETURN',
            title: 'New return request',
            message: `Return request #${returnRequest.id} for order #${order.id} is awaiting review.`,
            link: '/returns',
            transaction,
            warehouseId: order.WarehouseId
        });

        return returnRequest.reload({ include: returnInclude, transaction });
    });
};

exports.listReturns = async ({ user }) => {
    const where = {};
    const orderInclude = {
        model: Order,
        include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: Warehouse }]
    };

    if (user.role === 'customer') {
        where.createdBy = user.id;
    }
    if (user.role === 'warehouse_manager') {
        orderInclude.where = { WarehouseId: user.warehouseId || 0 };
    }

    return ReturnRequest.findAll({
        where,
        include: [
            orderInclude,
            { model: Product },
            { model: User, as: 'Customer', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'Handler', attributes: ['id', 'name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
    });
};

exports.handleReturn = async ({ id, status, user }) => {
    return sequelize.transaction(async (transaction) => {
        const returnRequest = await ReturnRequest.findByPk(id, {
            include: [{ model: Order }],
            transaction,
            lock: true
        });
        if (!returnRequest) throw new AppError('Return request not found', 404);

        if (returnRequest.status !== 'pending') {
            throw new AppError('Only pending return requests can be handled', 400);
        }

        if (user.role === 'warehouse_manager' && returnRequest.Order.WarehouseId !== user.warehouseId) {
            throw new AppError('Access denied for returns outside your warehouse', 403);
        }

        returnRequest.status = status;
        returnRequest.handledBy = user.id;
        returnRequest.handledAt = new Date();
        await returnRequest.save({ transaction });

        if (status === 'approved') {
            // Returned goods go back into inventory at the order warehouse
            await inventoryService.receiveStock({
                productId: returnRequest.productId,
                warehouseId: returnRequest.Order.WarehouseId,
                quantity: returnRequest.quantity,
                reason: 'Return approved',
                referenceType: 'ReturnRequest',
                referenceId: returnRequest.id,
                userId: user.id,
                transaction
            });
        }

        await auditService.log({
            action: status === 'approved' ? 'RETURN_APPROVED' : 'RETURN_REJECTED',
            entityType: 'ReturnRequest',
            entityId: returnRequest.id,
            performedBy: user.id,
            details: { orderId: returnRequest.OrderId, status },
            transaction
        });

        await notificationService.notify({
            userId: returnRequest.createdBy,
            type: 'RETURN',
            title: status === 'approved' ? 'Return approved' : 'Return rejected',
            message: status === 'approved'
                ? `Return request #${returnRequest.id} was approved. Goods restocked.`
                : `Return request #${returnRequest.id} was rejected.`,
            link: '/returns',
            transaction
        });

        return returnRequest.reload({ include: returnInclude, transaction });
    });
};
