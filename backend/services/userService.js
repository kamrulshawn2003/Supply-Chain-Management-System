const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { sequelize, User, Warehouse, Supplier } = require('../models');
const publicUser = require('../utils/publicUser');
const auditService = require('./auditService');

const validRoles = ['admin', 'supplier', 'warehouse_manager', 'customer', 'driver'];

const validateRoleScope = async ({ role, warehouseId, supplierId, transaction }) => {
    if (!validRoles.includes(role)) throw new AppError('Invalid role', 400);

    if (role === 'warehouse_manager' || role === 'driver') {
        if (!warehouseId) throw new AppError(`${role} requires warehouseId`, 400);
        const warehouse = await Warehouse.findByPk(warehouseId, { transaction });
        if (!warehouse) throw new AppError('Warehouse not found', 404);
    }

    if (role === 'supplier') {
        if (!supplierId) throw new AppError('Supplier role requires supplierId', 400);
        const supplier = await Supplier.findByPk(supplierId, { transaction });
        if (!supplier) throw new AppError('Supplier not found', 404);
    }
};

exports.listUsers = async () => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [Warehouse, Supplier],
        order: [['id', 'ASC']]
    });

    return users;
};

exports.getUser = async (id) => {
    const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [Warehouse, Supplier]
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
};

exports.createUser = async ({ payload, performedBy }) => {
    return sequelize.transaction(async (transaction) => {
        const existingUser = await User.findOne({
            where: { email: payload.email },
            transaction
        });

        if (existingUser) throw new AppError('User already exists', 400);

        await validateRoleScope({
            role: payload.role,
            warehouseId: payload.warehouseId,
            supplierId: payload.supplierId,
            transaction
        });

        const hashedPassword = await bcrypt.hash(payload.password, 10);
        const user = await User.create({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: payload.role,
            warehouseId: payload.warehouseId || null,
            supplierId: payload.supplierId || null
        }, { transaction });

        await auditService.log({
            action: 'USER_CREATED',
            entityType: 'User',
            entityId: user.id,
            performedBy,
            details: { role: user.role },
            transaction
        });

        return publicUser(user);
    });
};

exports.updateUser = async ({ id, payload, performedBy }) => {
    return sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(id, { transaction, lock: true });
        if (!user) throw new AppError('User not found', 404);

        if (payload.email && payload.email !== user.email) {
            const existingUser = await User.findOne({
                where: {
                    email: payload.email,
                    id: { [Op.ne]: id }
                },
                transaction
            });
            if (existingUser) throw new AppError('Email is already in use', 400);
        }

        const nextRole = payload.role || user.role;
        const nextWarehouseId = payload.warehouseId !== undefined ? payload.warehouseId : user.warehouseId;
        const nextSupplierId = payload.supplierId !== undefined ? payload.supplierId : user.supplierId;

        await validateRoleScope({
            role: nextRole,
            warehouseId: nextWarehouseId,
            supplierId: nextSupplierId,
            transaction
        });

        const updates = { ...payload };
        if (payload.password) {
            updates.password = await bcrypt.hash(payload.password, 10);
        }

        await user.update(updates, { transaction });

        await auditService.log({
            action: 'USER_UPDATED',
            entityType: 'User',
            entityId: user.id,
            performedBy,
            details: { updatedFields: Object.keys(payload) },
            transaction
        });

        return publicUser(user);
    });
};

exports.deleteUser = async ({ id, performedBy }) => {
    return sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(id, { transaction, lock: true });
        if (!user) throw new AppError('User not found', 404);

        await user.destroy({ transaction });
        await auditService.log({
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: Number(id),
            performedBy,
            details: { email: user.email, role: user.role },
            transaction
        });
    });
};
