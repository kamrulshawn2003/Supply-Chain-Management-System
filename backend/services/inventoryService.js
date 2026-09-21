const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const {
    sequelize,
    Inventory,
    InventoryMovement,
    Product,
    Warehouse
} = require('../models');
const auditService = require('./auditService');

const normalizeType = (type) => type === 'ADJUST' ? 'ADJUSTMENT' : type;

const getInventoryWithLock = async ({ productId, warehouseId, transaction }) => {
    return Inventory.findOne({
        where: { productId, warehouseId },
        transaction,
        lock: transaction ? true : undefined
    });
};

const ensureProductAndWarehouse = async ({ productId, warehouseId, transaction }) => {
    const [product, warehouse] = await Promise.all([
        Product.findByPk(productId, { transaction }),
        Warehouse.findByPk(warehouseId, { transaction })
    ]);

    if (!product) throw new AppError('Product not found', 404);
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    return { product, warehouse };
};

const createMovement = async ({
    type,
    productId,
    warehouseId,
    quantity,
    beforeQuantity,
    afterQuantity,
    reason,
    referenceType,
    referenceId,
    performedBy,
    transaction
}) => {
    return InventoryMovement.create({
        type,
        productId,
        warehouseId,
        quantity,
        beforeQuantity,
        afterQuantity,
        reason,
        referenceType,
        referenceId,
        performedBy
    }, { transaction });
};

exports.listInventory = async ({ user, warehouseId }) => {
    const where = {};

    if (user.role === 'warehouse_manager') {
        where.warehouseId = user.warehouseId || 0;
    }

    if (warehouseId) {
        const requestedWarehouseId = Number(warehouseId);
        if (user.role === 'warehouse_manager' && requestedWarehouseId !== user.warehouseId) {
            throw new AppError('Access denied for this warehouse inventory', 403);
        }
        where.warehouseId = requestedWarehouseId;
    }

    if (user.role === 'supplier') {
        return Inventory.findAll({
            where,
            include: [
                { model: Product, where: { SupplierId: user.supplierId || 0 } },
                { model: Warehouse }
            ]
        });
    }

    return Inventory.findAll({
        where,
        include: [Product, Warehouse]
    });
};

exports.getInventoryById = async ({ id, user }) => {
    const inventory = await Inventory.findByPk(id, {
        include: [Product, Warehouse]
    });

    if (!inventory) throw new AppError('Inventory item not found', 404);

    if (user.role === 'warehouse_manager' && inventory.warehouseId !== user.warehouseId) {
        throw new AppError('Access denied for this warehouse', 403);
    }

    if (user.role === 'supplier' && inventory.Product?.SupplierId !== user.supplierId) {
        throw new AppError('Access denied for this supplier inventory', 403);
    }

    return inventory;
};

exports.updateStock = async ({ payload, user }) => {
    return sequelize.transaction(async (transaction) => {
        const productId = Number(payload.productId);
        const warehouseId = Number(payload.warehouseId);
        const quantity = Number(payload.quantity);
        const type = normalizeType(payload.type);

        if (user.role === 'warehouse_manager' && user.warehouseId !== warehouseId) {
            throw new AppError('Warehouse managers can only update their warehouse inventory', 403);
        }

        await ensureProductAndWarehouse({ productId, warehouseId, transaction });

        let inventory = await getInventoryWithLock({ productId, warehouseId, transaction });

        if (!inventory) {
            if (type === 'OUT') {
                throw new AppError('Cannot remove stock from missing inventory', 400);
            }

            inventory = await Inventory.create({
                productId,
                warehouseId,
                quantity: 0,
                lowStockThreshold: payload.lowStockThreshold ?? 10
            }, { transaction });
        }

        const beforeQuantity = inventory.quantity;
        let afterQuantity = beforeQuantity;

        if (type === 'IN') afterQuantity += quantity;
        if (type === 'OUT') {
            if (quantity > beforeQuantity) {
                throw new AppError('Insufficient stock for OUT operation', 400);
            }
            afterQuantity -= quantity;
        }
        if (type === 'ADJUSTMENT') afterQuantity = quantity;

        await inventory.update({
            quantity: afterQuantity,
            lowStockThreshold: payload.lowStockThreshold ?? inventory.lowStockThreshold
        }, { transaction });

        await createMovement({
            type,
            productId,
            warehouseId,
            quantity,
            beforeQuantity,
            afterQuantity,
            reason: payload.reason || 'Manual inventory update',
            performedBy: user.id,
            transaction
        });

        await auditService.log({
            action: 'INVENTORY_UPDATE',
            entityType: 'Inventory',
            entityId: inventory.id,
            performedBy: user.id,
            details: { productId, warehouseId, type, quantity, beforeQuantity, afterQuantity },
            transaction
        });

        return inventory.reload({ transaction });
    });
};

exports.decrementForOrder = async ({ productId, warehouseId, quantity, orderId, userId, transaction }) => {
    const inventory = await getInventoryWithLock({ productId, warehouseId, transaction });

    if (!inventory) throw new AppError('Inventory not found for selected warehouse', 404);
    if (inventory.quantity < quantity) throw new AppError('Insufficient stock for this order', 400);

    const beforeQuantity = inventory.quantity;
    const afterQuantity = beforeQuantity - quantity;

    await inventory.update({ quantity: afterQuantity }, { transaction });
    await createMovement({
        type: 'OUT',
        productId,
        warehouseId,
        quantity,
        beforeQuantity,
        afterQuantity,
        reason: 'Order stock reservation',
        referenceType: 'Order',
        referenceId: orderId,
        performedBy: userId,
        transaction
    });

    return inventory;
};

exports.restockCancelledOrder = async ({ productId, warehouseId, quantity, orderId, userId, transaction }) => {
    const inventory = await getInventoryWithLock({ productId, warehouseId, transaction });

    if (!inventory) throw new AppError('Inventory not found for selected warehouse', 404);

    const beforeQuantity = inventory.quantity;
    const afterQuantity = beforeQuantity + quantity;

    await inventory.update({ quantity: afterQuantity }, { transaction });
    await createMovement({
        type: 'IN',
        productId,
        warehouseId,
        quantity,
        beforeQuantity,
        afterQuantity,
        reason: 'Cancelled order restock',
        referenceType: 'Order',
        referenceId: orderId,
        performedBy: userId,
        transaction
    });
};

exports.transferStock = async ({ payload, user }) => {
    return sequelize.transaction(async (transaction) => {
        const productId = Number(payload.productId);
        const fromWarehouseId = Number(payload.fromWarehouseId);
        const toWarehouseId = Number(payload.toWarehouseId);
        const quantity = Number(payload.quantity);

        if (fromWarehouseId === toWarehouseId) {
            throw new AppError('Source and destination warehouses must be different', 400);
        }

        if (user.role === 'warehouse_manager' && user.warehouseId !== fromWarehouseId) {
            throw new AppError('Warehouse managers can only transfer from their warehouse', 403);
        }

        await ensureProductAndWarehouse({ productId, warehouseId: fromWarehouseId, transaction });
        await ensureProductAndWarehouse({ productId, warehouseId: toWarehouseId, transaction });

        const source = await getInventoryWithLock({ productId, warehouseId: fromWarehouseId, transaction });
        if (!source || source.quantity < quantity) {
            throw new AppError('Insufficient stock for transfer', 400);
        }

        let destination = await getInventoryWithLock({ productId, warehouseId: toWarehouseId, transaction });
        if (!destination) {
            destination = await Inventory.create({
                productId,
                warehouseId: toWarehouseId,
                quantity: 0
            }, { transaction });
        }

        const sourceBefore = source.quantity;
        const sourceAfter = sourceBefore - quantity;
        const destinationBefore = destination.quantity;
        const destinationAfter = destinationBefore + quantity;

        await source.update({ quantity: sourceAfter }, { transaction });
        await destination.update({ quantity: destinationAfter }, { transaction });

        await createMovement({
            type: 'TRANSFER_OUT',
            productId,
            warehouseId: fromWarehouseId,
            quantity,
            beforeQuantity: sourceBefore,
            afterQuantity: sourceAfter,
            reason: 'Warehouse transfer',
            performedBy: user.id,
            transaction
        });

        await createMovement({
            type: 'TRANSFER_IN',
            productId,
            warehouseId: toWarehouseId,
            quantity,
            beforeQuantity: destinationBefore,
            afterQuantity: destinationAfter,
            reason: 'Warehouse transfer',
            performedBy: user.id,
            transaction
        });

        await auditService.log({
            action: 'INVENTORY_TRANSFER',
            entityType: 'Inventory',
            entityId: source.id,
            performedBy: user.id,
            details: { productId, fromWarehouseId, toWarehouseId, quantity },
            transaction
        });

        return { source, destination };
    });
};

exports.getLowStock = async ({ user }) => {
    const where = sequelize.where(
        sequelize.col('Inventory.quantity'),
        Op.lt,
        sequelize.col('Inventory.lowStockThreshold')
    );

    const productInclude = { model: Product };
    const options = {
        where,
        include: [productInclude, Warehouse]
    };

    if (user.role === 'warehouse_manager') {
        options.where = {
            [Op.and]: [
                where,
                { warehouseId: user.warehouseId || 0 }
            ]
        };
    }

    if (user.role === 'supplier') {
        productInclude.where = { SupplierId: user.supplierId || 0 };
    }

    return Inventory.findAll(options);
};
