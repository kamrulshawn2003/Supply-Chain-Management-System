const AppError = require('../utils/AppError');
const {
    sequelize,
    PurchaseOrder,
    PurchaseOrderItem,
    Product,
    Supplier,
    Warehouse,
    User
} = require('../models');
const inventoryService = require('./inventoryService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const poInclude = [
    { model: Supplier },
    { model: Warehouse },
    { model: User, as: 'CreatedBy', attributes: ['id', 'name', 'email', 'role'] },
    { model: PurchaseOrderItem, include: [Product] }
];

const generatePoNumber = () => `PO-${Date.now()}`;

exports.createPurchaseOrder = async ({ user, payload }) => {
    return sequelize.transaction(async (transaction) => {
        const supplier = await Supplier.findByPk(payload.supplierId, { transaction });
        if (!supplier) throw new AppError('Supplier not found', 404);

        const warehouse = await Warehouse.findByPk(payload.warehouseId, { transaction });
        if (!warehouse) throw new AppError('Warehouse not found', 404);

        const items = [];
        let totalPrice = 0;

        for (const rawItem of payload.items) {
            const product = await Product.findByPk(rawItem.productId, { transaction });
            if (!product) throw new AppError('Product not found', 404);
            if (product.SupplierId !== supplier.id) {
                throw new AppError(`Product "${product.name}" does not belong to the selected supplier`, 400);
            }

            const quantity = Number(rawItem.quantity);
            const unitPrice = Number(rawItem.unitPrice);
            if (quantity <= 0 || unitPrice < 0) {
                throw new AppError('Invalid item quantity or unit price', 400);
            }

            items.push({ product, quantity, unitPrice });
            totalPrice += quantity * unitPrice;
        }

        if (!items.length) throw new AppError('Purchase order must contain at least one item', 400);

        const po = await PurchaseOrder.create({
            poNumber: generatePoNumber(),
            SupplierId: supplier.id,
            warehouseId: warehouse.id,
            status: 'pending',
            totalPrice,
            expectedDate: payload.expectedDate || null,
            notes: payload.notes || null,
            createdBy: user.id
        }, { transaction });

        await PurchaseOrderItem.bulkCreate(
            items.map(({ product, quantity, unitPrice }) => ({
                PurchaseOrderId: po.id,
                ProductId: product.id,
                quantity,
                unitPrice,
                lineTotal: quantity * unitPrice
            })),
            { transaction }
        );

        await auditService.log({
            action: 'PO_CREATED',
            entityType: 'PurchaseOrder',
            entityId: po.id,
            performedBy: user.id,
            details: { supplierId: supplier.id, warehouseId: warehouse.id, totalPrice },
            transaction
        });

        // Notify the supplier about the new purchase order
        await notificationService.notifyRole({
            role: 'supplier',
            type: 'PO',
            title: 'New purchase order',
            message: `New purchase order ${po.poNumber} ($${Number(totalPrice).toFixed(2)}) requires your review.`,
            link: `/purchase-orders/${po.id}`,
            transaction
        });

        return po.reload({ include: poInclude, transaction });
    });
};

exports.listPurchaseOrders = async ({ user }) => {
    const where = {};
    if (user.role === 'supplier') where.SupplierId = user.supplierId || 0;

    return PurchaseOrder.findAll({
        where,
        include: poInclude,
        order: [['createdAt', 'DESC']]
    });
};

exports.getPurchaseOrderById = async ({ id, user }) => {
    const po = await PurchaseOrder.findByPk(id, { include: poInclude });
    if (!po) throw new AppError('Purchase order not found', 404);

    if (user.role === 'supplier' && po.SupplierId !== user.supplierId) {
        throw new AppError('You are not allowed to view this purchase order', 403);
    }

    return po;
};

exports.approvePurchaseOrder = async ({ id, user }) => {
    return sequelize.transaction(async (transaction) => {
        const po = await PurchaseOrder.findByPk(id, { transaction, lock: true });
        if (!po) throw new AppError('Purchase order not found', 404);

        if (!['draft', 'pending'].includes(po.status)) {
            throw new AppError('Only draft or pending purchase orders can be approved', 400);
        }

        po.status = 'approved';
        await po.save({ transaction });

        await auditService.log({
            action: 'PO_APPROVED',
            entityType: 'PurchaseOrder',
            entityId: po.id,
            performedBy: user.id,
            details: { poNumber: po.poNumber },
            transaction
        });

        await notificationService.notifyRole({
            role: 'supplier',
            type: 'PO',
            title: 'Purchase order approved',
            message: `Purchase order ${po.poNumber} has been approved.`,
            link: `/purchase-orders/${po.id}`,
            transaction
        });

        return po.reload({ include: poInclude, transaction });
    });
};

exports.receivePurchaseOrder = async ({ id, user }) => {
    return sequelize.transaction(async (transaction) => {
        const po = await PurchaseOrder.findByPk(id, {
            include: [{ model: PurchaseOrderItem }],
            transaction,
            lock: true
        });
        if (!po) throw new AppError('Purchase order not found', 404);

        if (po.status !== 'approved') {
            throw new AppError('Only approved purchase orders can be received', 400);
        }

        if (user.role === 'warehouse_manager' && user.warehouseId !== po.warehouseId) {
            throw new AppError('Warehouse managers can only receive orders for their warehouse', 403);
        }

        const items = await PurchaseOrderItem.findAll({ where: { PurchaseOrderId: po.id }, transaction });

        for (const item of items) {
            await inventoryService.receiveStock({
                productId: item.ProductId,
                warehouseId: po.warehouseId,
                quantity: item.quantity,
                reason: `Purchase order ${po.poNumber} received`,
                referenceType: 'PurchaseOrder',
                referenceId: po.id,
                userId: user.id,
                transaction
            });
        }

        po.status = 'received';
        po.receivedAt = new Date();
        await po.save({ transaction });

        await auditService.log({
            action: 'PO_RECEIVED',
            entityType: 'PurchaseOrder',
            entityId: po.id,
            performedBy: user.id,
            details: { poNumber: po.poNumber, items: items.length },
            transaction
        });

        await notificationService.notifyRole({
            role: 'supplier',
            type: 'PO',
            title: 'Purchase order received',
            message: `Purchase order ${po.poNumber} has been received into inventory.`,
            link: `/purchase-orders/${po.id}`,
            transaction
        });

        return po.reload({ include: poInclude, transaction });
    });
};

exports.cancelPurchaseOrder = async ({ id, user }) => {
    return sequelize.transaction(async (transaction) => {
        const po = await PurchaseOrder.findByPk(id, { transaction, lock: true });
        if (!po) throw new AppError('Purchase order not found', 404);

        if (!['draft', 'pending', 'approved'].includes(po.status)) {
            throw new AppError('Only draft, pending or approved purchase orders can be cancelled', 400);
        }

        po.status = 'cancelled';
        await po.save({ transaction });

        await auditService.log({
            action: 'PO_CANCELLED',
            entityType: 'PurchaseOrder',
            entityId: po.id,
            performedBy: user.id,
            details: { poNumber: po.poNumber },
            transaction
        });

        return po.reload({ include: poInclude, transaction });
    });
};
